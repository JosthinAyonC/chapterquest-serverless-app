import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Canvas,
  FabricImage,
  IText,
  PencilBrush,
  type FabricObject,
  type TPointerEventInfo,
} from 'fabric';
import { downscaleImageFile } from '../lib/roleplay/image-utils';
import {
  createEditorText,
  handleTextEditingExited,
  attachDeleteControlIfNeeded,
  prepareTextForEditing,
  stripPlaceholderFromText,
  setupCanvasObjectControls,
} from '../lib/roleplay/fabric-text-utils';
import type { PdfPageRender } from '../lib/roleplay/pdf-render';
import { pageCanvasHasContent } from '../lib/roleplay/canvas-pages';
import type { EditorTool } from '../components/roleplay/EditorToolbar';

const MAX_HISTORY = 30;
const AUTOSAVE_MS = 500;

interface PageHistory {
  undo: string[];
  redo: string[];
}

interface UseFabricEditorOptions {
  pages: PdfPageRender[];
  initialCanvasPages: (string | null)[];
  isIllustrator: boolean;
  onPersist: (canvasPages: (string | null)[]) => void;
  onStorageError: (message: string) => void;
}

function createHistoryStacks(pageCount: number): PageHistory[] {
  return Array.from({ length: pageCount }, () => ({ undo: [], redo: [] }));
}

function cloneCanvasPages(pages: (string | null)[]): (string | null)[] {
  return [...pages];
}

export function useFabricEditor({
  pages,
  initialCanvasPages,
  isIllustrator,
  onPersist,
  onStorageError,
}: UseFabricEditorOptions) {
  const canvasElementRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const canvasPagesRef = useRef<(string | null)[]>(cloneCanvasPages(initialCanvasPages));
  const historyRef = useRef<PageHistory[]>(createHistoryStacks(pages.length));
  const activePageRef = useRef(0);
  const activeToolRef = useRef<EditorTool>('select');
  const strokeColorRef = useRef('#800000');
  const strokeWidthRef = useRef(4);
  const autosaveTimerRef = useRef<number | null>(null);
  const isRestoringRef = useRef(false);

  const [activeTool, setActiveTool] = useState<EditorTool>('select');
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [strokeColor, setStrokeColor] = useState('#800000');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [ready, setReady] = useState(false);
  const [pagesWithContent, setPagesWithContent] = useState<boolean[]>(() =>
    initialCanvasPages.map(pageCanvasHasContent),
  );

  const syncPagesWithContent = useCallback(() => {
    setPagesWithContent(canvasPagesRef.current.map(pageCanvasHasContent));
  }, []);

  const switchToSelectTool = useCallback(() => {
    activeToolRef.current = 'select';
    setActiveTool('select');
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.skipTargetFind = false;
    canvas.defaultCursor = 'default';
  }, []);

  const ensureHistoryStacks = useCallback((pageCount: number) => {
    if (pageCount <= 0) return;
    const previous = historyRef.current;
    historyRef.current = createHistoryStacks(pageCount);
    for (let index = 0; index < pageCount; index += 1) {
      if (previous[index]) {
        historyRef.current[index] = previous[index];
      }
    }
  }, []);

  const getPageHistory = useCallback(
    (pageIndex: number): PageHistory => {
      ensureHistoryStacks(Math.max(pages.length, pageIndex + 1));
      return historyRef.current[pageIndex];
    },
    [ensureHistoryStacks, pages.length],
  );

  const updateHistoryFlags = useCallback(
    (pageIndex: number) => {
      const history = getPageHistory(pageIndex);
      setCanUndo(history.undo.length > 0);
      setCanRedo(history.redo.length > 0);
    },
    [getPageHistory],
  );

  const serializeCurrentPage = useCallback((): string => {
    const canvas = fabricRef.current;
    if (!canvas) return JSON.stringify({ version: '7.0.0', objects: [] });
    return JSON.stringify(canvas.toJSON());
  }, []);

  const scheduleAutosave = useCallback(() => {
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = window.setTimeout(() => {
      const pageIndex = activePageRef.current;
      canvasPagesRef.current[pageIndex] = serializeCurrentPage();
      try {
        onPersist(cloneCanvasPages(canvasPagesRef.current));
      } catch (error) {
        onStorageError(
          error instanceof Error
            ? error.message
            : 'Could not save your work to this browser.',
        );
      }
    }, AUTOSAVE_MS);
  }, [onPersist, onStorageError, serializeCurrentPage]);

  const pushHistorySnapshot = useCallback(
    (pageIndex: number, snapshot: string) => {
      const history = getPageHistory(pageIndex);
      history.undo.push(snapshot);
      if (history.undo.length > MAX_HISTORY) history.undo.shift();
      history.redo = [];
      updateHistoryFlags(pageIndex);
    },
    [getPageHistory, updateHistoryFlags],
  );

  const applyBrush = useCallback((canvas: Canvas) => {
    const brush = new PencilBrush(canvas);
    brush.color = strokeColorRef.current;
    brush.width = strokeWidthRef.current;
    canvas.freeDrawingBrush = brush;
  }, []);

  const pagesRef = useRef(pages);
  pagesRef.current = pages;

  const resizeCanvasToContainer = useCallback(
    (canvas: Canvas, page: PdfPageRender) => {
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = Math.floor(container.clientWidth);
      const containerHeight = Math.floor(container.clientHeight);
      if (containerWidth <= 0 || containerHeight <= 0) return;

      const scale = Math.min(
        containerWidth / page.width,
        containerHeight / page.height,
      );
      const displayWidth = Math.max(1, Math.floor(page.width * scale));
      const displayHeight = Math.max(1, Math.floor(page.height * scale));

      canvas.setDimensions({ width: page.width, height: page.height });
      canvas.setDimensions(
        { width: displayWidth, height: displayHeight },
        { cssOnly: true },
      );
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      canvas.calcOffset();

      const fabricWrapper = canvas.getElement().parentElement;
      if (fabricWrapper instanceof HTMLElement) {
        fabricWrapper.style.width = `${displayWidth}px`;
        fabricWrapper.style.height = `${displayHeight}px`;
        fabricWrapper.style.margin = '0';
      }

      canvas.requestRenderAll();
    },
    [],
  );

  const refreshCanvasLayout = useCallback(
    (canvas: Canvas, page: PdfPageRender) => {
      resizeCanvasToContainer(canvas, page);
      requestAnimationFrame(() => {
        if (fabricRef.current !== canvas) return;
        resizeCanvasToContainer(canvas, page);
      });
    },
    [resizeCanvasToContainer],
  );

  const applyPageBackground = useCallback(async (canvas: Canvas, page: PdfPageRender) => {
    const background = await FabricImage.fromURL(page.dataUrl, { crossOrigin: 'anonymous' });
    background.set({
      selectable: false,
      evented: false,
      originX: 'left',
      originY: 'top',
      left: 0,
      top: 0,
      scaleX: page.width / (background.width || page.width),
      scaleY: page.height / (background.height || page.height),
    });
    canvas.backgroundImage = background;
    canvas.requestRenderAll();
  }, []);

  const syncCanvasState = useCallback(
    (recordHistory: boolean) => {
      if (isRestoringRef.current) return;
      const pageIndex = activePageRef.current;
      const canvas = fabricRef.current;
      if (!canvas) return;

      if (recordHistory) {
        const previous = canvasPagesRef.current[pageIndex];
        pushHistorySnapshot(
          pageIndex,
          previous ?? JSON.stringify({ version: '7.0.0', objects: [] }),
        );
      }

      canvasPagesRef.current[pageIndex] = serializeCurrentPage();
      scheduleAutosave();
      setCanDelete(Boolean(canvas.getActiveObject()));
      syncPagesWithContent();
    },
    [pushHistorySnapshot, scheduleAutosave, serializeCurrentPage, syncPagesWithContent],
  );

  const handleCanvasChange = useCallback(() => {
    syncCanvasState(true);
  }, [syncCanvasState]);

  const loadPage = useCallback(
    async (pageIndex: number) => {
      const canvas = fabricRef.current;
      const page = pages[pageIndex];
      if (!canvas || !page) return;

      ensureHistoryStacks(pages.length);
      isRestoringRef.current = true;
      try {
        canvas.clear();
        canvas.discardActiveObject();

        const savedJson = canvasPagesRef.current[pageIndex];
        if (savedJson) {
          await canvas.loadFromJSON(JSON.parse(savedJson));
        }

        await applyPageBackground(canvas, page);
        setupCanvasObjectControls(canvas, handleCanvasChange);
        refreshCanvasLayout(canvas, page);
        applyBrush(canvas);
        canvas.isDrawingMode = activeToolRef.current === 'draw';
        canvas.selection = activeToolRef.current === 'select';
        canvas.skipTargetFind = activeToolRef.current === 'draw';
        canvas.requestRenderAll();
        updateHistoryFlags(pageIndex);
        syncPagesWithContent();
      } finally {
        isRestoringRef.current = false;
      }
    },
    [
      applyBrush,
      ensureHistoryStacks,
      pages,
      applyPageBackground,
      refreshCanvasLayout,
      updateHistoryFlags,
      handleCanvasChange,
      syncPagesWithContent,
    ],
  );

  useEffect(() => {
    activeToolRef.current = activeTool;
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.isDrawingMode = activeTool === 'draw';
    canvas.selection = activeTool === 'select';
    canvas.skipTargetFind = activeTool === 'draw';
    canvas.defaultCursor = activeTool === 'draw' ? 'crosshair' : 'default';
    applyBrush(canvas);
    canvas.requestRenderAll();
  }, [activeTool, applyBrush]);

  useEffect(() => {
    strokeColorRef.current = strokeColor;
    const canvas = fabricRef.current;
    if (!canvas) return;
    applyBrush(canvas);
    const active = canvas.getActiveObject();
    if (active instanceof IText) {
      active.set('fill', strokeColor);
      canvas.requestRenderAll();
    }
  }, [applyBrush, strokeColor]);

  useEffect(() => {
    strokeWidthRef.current = strokeWidth;
    const canvas = fabricRef.current;
    if (!canvas) return;
    applyBrush(canvas);
  }, [applyBrush, strokeWidth]);

  useLayoutEffect(() => {
    if (pages.length === 0) {
      setReady(false);
      return undefined;
    }

    ensureHistoryStacks(pages.length);
    while (canvasPagesRef.current.length < pages.length) {
      canvasPagesRef.current.push(null);
    }

    const element = canvasElementRef.current;
    const container = containerRef.current;
    if (!element || !container) return undefined;

    setReady(false);

    const canvas = new Canvas(element, {
      width: pages[0].width,
      height: pages[0].height,
      preserveObjectStacking: true,
      allowTouchScrolling: false,
    });
    fabricRef.current = canvas;

    const onObjectModified = () => handleCanvasChange();
    const onPathCreated = (event: { path: FabricObject }) => {
      attachDeleteControlIfNeeded(event.path, handleCanvasChange);
      handleCanvasChange();
    };
    const onObjectAdded = (event: { target: FabricObject }) => {
      if (isRestoringRef.current) return;
      attachDeleteControlIfNeeded(event.target, handleCanvasChange);
    };
    const onObjectRemoved = () => handleCanvasChange();
    const onSelectionChange = () => {
      setCanDelete(Boolean(canvas.getActiveObject()));
    };
    const onTextEditingEntered = (event: { target: IText }) => {
      prepareTextForEditing(event.target, strokeColorRef.current);
      canvas.requestRenderAll();
    };
    const onTextEditingExited = (event: { target: IText }) => {
      handleTextEditingExited(event.target, canvas);
      handleCanvasChange();
    };
    const onTextChanged = (event: { target: IText }) => {
      if (stripPlaceholderFromText(event.target, strokeColorRef.current)) {
        canvas.requestRenderAll();
      }
      syncCanvasState(false);
    };

    canvas.on('object:modified', onObjectModified);
    canvas.on('path:created', onPathCreated);
    canvas.on('object:added', onObjectAdded);
    canvas.on('object:removed', onObjectRemoved);
    canvas.on('selection:created', onSelectionChange);
    canvas.on('selection:updated', onSelectionChange);
    canvas.on('selection:cleared', onSelectionChange);
    canvas.on('text:editing:entered', onTextEditingEntered);
    canvas.on('text:editing:exited', onTextEditingExited);
    canvas.on('text:changed', onTextChanged);

    const onMouseDown = (event: TPointerEventInfo) => {
      if (activeToolRef.current !== 'text' || event.target) return;
      const pointer = canvas.getScenePoint(event.e);
      const text = createEditorText(
        {
          left: pointer.x,
          top: pointer.y,
          fill: strokeColorRef.current,
        },
        handleCanvasChange,
        true,
      );
      prepareTextForEditing(text, strokeColorRef.current);
      canvas.add(text);
      canvas.setActiveObject(text);
      text.enterEditing();
      switchToSelectTool();
      canvas.requestRenderAll();
    };
    canvas.on('mouse:down', onMouseDown);

    void loadPage(0)
      .then(() => setReady(true))
      .catch(() => setReady(false));

    const onWindowResize = () => {
      const page = pagesRef.current[activePageRef.current];
      const currentCanvas = fabricRef.current;
      if (page && currentCanvas) {
        refreshCanvasLayout(currentCanvas, page);
      }
    };

    const resizeObserver = new ResizeObserver(onWindowResize);
    resizeObserver.observe(container);
    window.addEventListener('orientationchange', onWindowResize);

    return () => {
      setReady(false);
      resizeObserver.disconnect();
      window.removeEventListener('orientationchange', onWindowResize);
      canvas.off('object:modified', onObjectModified);
      canvas.off('path:created', onPathCreated);
      canvas.off('object:added', onObjectAdded);
      canvas.off('object:removed', onObjectRemoved);
      canvas.off('selection:created', onSelectionChange);
      canvas.off('selection:updated', onSelectionChange);
      canvas.off('selection:cleared', onSelectionChange);
      canvas.off('text:editing:entered', onTextEditingEntered);
      canvas.off('text:editing:exited', onTextEditingExited);
      canvas.off('text:changed', onTextChanged);
      canvas.off('mouse:down', onMouseDown);
      canvas.dispose();
      fabricRef.current = null;
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
  }, [
    ensureHistoryStacks,
    handleCanvasChange,
    loadPage,
    pages,
    refreshCanvasLayout,
    syncCanvasState,
    switchToSelectTool,
  ]);

  const switchPage = useCallback(
    async (nextIndex: number) => {
      if (nextIndex === activePageRef.current) return;
      const canvas = fabricRef.current;
      if (!canvas) return;

      canvasPagesRef.current[activePageRef.current] = serializeCurrentPage();
      activePageRef.current = nextIndex;
      setActivePageIndex(nextIndex);
      await loadPage(nextIndex);
      scheduleAutosave();
    },
    [loadPage, scheduleAutosave, serializeCurrentPage],
  );

  const undo = useCallback(async () => {
    const pageIndex = activePageRef.current;
    const history = getPageHistory(pageIndex);
    const canvas = fabricRef.current;
    if (!canvas || history.undo.length === 0) return;

    const current = serializeCurrentPage();
    history.redo.push(current);
    const previous = history.undo.pop();
    if (!previous) return;

    canvasPagesRef.current[pageIndex] = previous;
    isRestoringRef.current = true;
    try {
      canvas.clear();
      await canvas.loadFromJSON(JSON.parse(previous));
      await applyPageBackground(canvas, pages[pageIndex]);
      setupCanvasObjectControls(canvas, handleCanvasChange);
      refreshCanvasLayout(canvas, pages[pageIndex]);
      canvas.requestRenderAll();
    } finally {
      isRestoringRef.current = false;
    }
    updateHistoryFlags(pageIndex);
    scheduleAutosave();
  }, [
    pages,
    scheduleAutosave,
    serializeCurrentPage,
    applyPageBackground,
    refreshCanvasLayout,
    getPageHistory,
    updateHistoryFlags,
    handleCanvasChange,
  ]);

  const redo = useCallback(async () => {
    const pageIndex = activePageRef.current;
    const history = getPageHistory(pageIndex);
    const canvas = fabricRef.current;
    if (!canvas || history.redo.length === 0) return;

    const current = serializeCurrentPage();
    history.undo.push(current);
    const next = history.redo.pop();
    if (!next) return;

    canvasPagesRef.current[pageIndex] = next;
    isRestoringRef.current = true;
    try {
      canvas.clear();
      await canvas.loadFromJSON(JSON.parse(next));
      await applyPageBackground(canvas, pages[pageIndex]);
      setupCanvasObjectControls(canvas, handleCanvasChange);
      refreshCanvasLayout(canvas, pages[pageIndex]);
      canvas.requestRenderAll();
    } finally {
      isRestoringRef.current = false;
    }
    updateHistoryFlags(pageIndex);
    scheduleAutosave();
  }, [
    pages,
    scheduleAutosave,
    serializeCurrentPage,
    applyPageBackground,
    refreshCanvasLayout,
    getPageHistory,
    updateHistoryFlags,
    handleCanvasChange,
  ]);

  const deleteSelection = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;
    activeObjects.forEach((object) => canvas.remove(object));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    handleCanvasChange();
  }, [handleCanvasChange]);

  const clearPage = useCallback(async () => {
    const pageIndex = activePageRef.current;
    const canvas = fabricRef.current;
    if (!canvas) return;

    pushHistorySnapshot(pageIndex, serializeCurrentPage());
    canvasPagesRef.current[pageIndex] = null;
    isRestoringRef.current = true;
    canvas.clear();
    await applyPageBackground(canvas, pages[pageIndex]);
    refreshCanvasLayout(canvas, pages[pageIndex]);
    canvas.requestRenderAll();
    isRestoringRef.current = false;
    scheduleAutosave();
    updateHistoryFlags(pageIndex);
    setCanDelete(false);
  }, [
    pages,
    pushHistorySnapshot,
    scheduleAutosave,
    serializeCurrentPage,
    applyPageBackground,
    refreshCanvasLayout,
    updateHistoryFlags,
  ]);

  const insertImage = useCallback(
    async (file: File) => {
      if (!isIllustrator) return;
      const canvas = fabricRef.current;
      if (!canvas) return;

      try {
        const dataUrl = await downscaleImageFile(file);
        const image = await FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' });
        const maxEdge = Math.min(canvas.getWidth(), canvas.getHeight()) * 0.45;
        const scale = maxEdge / Math.max(image.width || maxEdge, image.height || maxEdge);
        image.set({
          left: canvas.getWidth() * 0.2,
          top: canvas.getHeight() * 0.2,
          scaleX: scale,
          scaleY: scale,
        });
        canvas.add(image);
        attachDeleteControlIfNeeded(image, handleCanvasChange);
        canvas.setActiveObject(image);
        canvas.requestRenderAll();
        handleCanvasChange();
      } catch {
        onStorageError('Could not add that image. Try a smaller JPG or PNG.');
      }
    },
    [handleCanvasChange, isIllustrator, onStorageError],
  );

  const getCanvasPagesSnapshot = useCallback((): (string | null)[] => {
    const pageIndex = activePageRef.current;
    canvasPagesRef.current[pageIndex] = serializeCurrentPage();
    syncPagesWithContent();
    return cloneCanvasPages(canvasPagesRef.current);
  }, [serializeCurrentPage, syncPagesWithContent]);

  const undoRef = useRef(undo);
  undoRef.current = undo;
  const redoRef = useRef(redo);
  redoRef.current = redo;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;

      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      }

      const canvas = fabricRef.current;
      const active = canvas?.getActiveObject();
      if (active instanceof IText && active.isEditing) return;

      const key = event.key.toLowerCase();
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault();
        void undoRef.current();
        return;
      }
      if ((key === 'z' && event.shiftKey) || key === 'y') {
        event.preventDefault();
        void redoRef.current();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return {
    canvasElementRef,
    containerRef,
    ready,
    activeTool,
    setActiveTool,
    activePageIndex,
    switchPage,
    strokeColor,
    setStrokeColor,
    strokeWidth,
    setStrokeWidth,
    canUndo,
    canRedo,
    canDelete,
    undo,
    redo,
    deleteSelection,
    clearPage,
    insertImage,
    getCanvasPagesSnapshot,
    pagesWithContent,
  };
}
