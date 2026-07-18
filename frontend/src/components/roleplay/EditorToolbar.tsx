export type EditorTool = 'select' | 'text' | 'draw';

export interface EditorToolbarProps {
  activeTool: EditorTool;
  activePageIndex: number;
  pageCount: number;
  strokeColor: string;
  strokeWidth: number;
  canUndo: boolean;
  canRedo: boolean;
  canDelete: boolean;
  isIllustrator: boolean;
  onToolChange: (tool: EditorTool) => void;
  onPageChange: (pageIndex: number) => void;
  onStrokeColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDeleteSelection: () => void;
  onClearPage: () => void;
  onImageUpload: (file: File) => void;
}

const STROKE_WIDTHS = [2, 4, 8];

export default function EditorToolbar({
  activeTool,
  activePageIndex,
  pageCount,
  strokeColor,
  strokeWidth,
  canUndo,
  canRedo,
  canDelete,
  isIllustrator,
  onToolChange,
  onPageChange,
  onStrokeColorChange,
  onStrokeWidthChange,
  onUndo,
  onRedo,
  onDeleteSelection,
  onClearPage,
  onImageUpload,
}: EditorToolbarProps) {
  return (
    <div className="roleplay-editor-toolbar" role="toolbar" aria-label="Review editor tools">
      <div className="roleplay-editor-toolbar-group">
        <button
          type="button"
          className={`roleplay-editor-tool${activeTool === 'select' ? ' roleplay-editor-tool--active' : ''}`}
          aria-pressed={activeTool === 'select'}
          onClick={() => onToolChange('select')}
        >
          Select
        </button>
        <button
          type="button"
          className={`roleplay-editor-tool${activeTool === 'text' ? ' roleplay-editor-tool--active' : ''}`}
          aria-pressed={activeTool === 'text'}
          onClick={() => onToolChange('text')}
        >
          Text
        </button>
        <button
          type="button"
          className={`roleplay-editor-tool${activeTool === 'draw' ? ' roleplay-editor-tool--active' : ''}`}
          aria-pressed={activeTool === 'draw'}
          onClick={() => onToolChange('draw')}
        >
          Draw
        </button>
        {isIllustrator ? (
          <label className="roleplay-editor-tool roleplay-editor-tool--file">
            Image
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onImageUpload(file);
                event.target.value = '';
              }}
            />
          </label>
        ) : null}
      </div>

      <div className="roleplay-editor-toolbar-group">
        <label className="roleplay-editor-toolbar-label">
          Color
          <input
            type="color"
            value={strokeColor}
            onChange={(event) => onStrokeColorChange(event.target.value)}
            aria-label="Stroke color"
          />
        </label>
        <label className="roleplay-editor-toolbar-label">
          Size
          <select
            value={strokeWidth}
            onChange={(event) => onStrokeWidthChange(Number(event.target.value))}
            aria-label="Stroke width"
          >
            {STROKE_WIDTHS.map((width) => (
              <option key={width} value={width}>
                {width}px
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="roleplay-editor-toolbar-group">
        {Array.from({ length: pageCount }, (_, index) => (
          <button
            key={index}
            type="button"
            className={`roleplay-editor-tool${activePageIndex === index ? ' roleplay-editor-tool--active' : ''}`}
            aria-pressed={activePageIndex === index}
            onClick={() => onPageChange(index)}
          >
            Page {index + 1}
          </button>
        ))}
      </div>

      <div className="roleplay-editor-toolbar-group">
        <button
          type="button"
          className="roleplay-editor-tool"
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          onClick={onUndo}
        >
          Undo
        </button>
        <button
          type="button"
          className="roleplay-editor-tool"
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
          onClick={onRedo}
        >
          Redo
        </button>
        <button
          type="button"
          className="roleplay-editor-tool"
          disabled={!canDelete}
          onClick={onDeleteSelection}
        >
          Delete
        </button>
        <button type="button" className="roleplay-editor-tool" onClick={onClearPage}>
          Clear page
        </button>
      </div>
    </div>
  );
}
