/**
 * CitationNode - Custom Lexical node for legal citation tokens [1A], [2B], etc.
 * 
 * Features:
 * - Visual styling with blue background and rounded borders
 * - Click handlers to trigger right panel navigation
 * - Custom serialization for import/export
 * - Keyboard navigation support
 * - Proper accessibility attributes
 */
import { 
  $applyNodeReplacement,
  NodeKey,
  LexicalNode,
  createCommand,
  LexicalCommand,
  DecoratorNode,
  SerializedLexicalNode,
  Spread,
  EditorConfig,
  LexicalEditor
} from 'lexical';
import React from 'react';
import { Box, Chip } from '@mui/material';
import { LinkOutlined } from '@mui/icons-material';

// Command for inserting citation
export const INSERT_CITATION_COMMAND: LexicalCommand<CitationPayload> = createCommand(
  'INSERT_CITATION_COMMAND'
);

// Command for citation click events
export const CITATION_CLICK_COMMAND: LexicalCommand<CitationClickPayload> = createCommand(
  'CITATION_CLICK_COMMAND'
);

export interface CitationPayload {
  exhibitId: string; // Changed from exhibitLetter to exhibitId (e.g., "1A", "2B")
  pageNumber?: number; // Optional page number for references like [2B:15]
  description?: string;
  fileId?: string;
  citationReference: string; // Full reference like "1A" or "2B:15"
}

export interface CitationClickPayload {
  exhibitId: string; // Changed from exhibitLetter to exhibitId
  pageNumber?: number;
  fileId?: string;
  citationReference: string;
}

export interface SerializedCitationNode extends Spread<CitationPayload, SerializedLexicalNode> {
  type: 'citation';
  version: 1;
}

class CitationNode extends DecoratorNode<JSX.Element> {
  __exhibitId: string;
  __pageNumber?: number;
  __description?: string;
  __fileId?: string;
  __citationReference: string;

  static getType(): string {
    return 'citation';
  }

  static clone(node: CitationNode): CitationNode {
    return new CitationNode(
      node.__exhibitId,
      node.__pageNumber,
      node.__description,
      node.__fileId,
      node.__citationReference,
      node.__key
    );
  }

  constructor(
    exhibitId: string,
    pageNumber?: number,
    description?: string,
    fileId?: string,
    citationReference?: string,
    key?: NodeKey
  ) {
    super(key);
    this.__exhibitId = exhibitId;
    this.__pageNumber = pageNumber;
    this.__description = description;
    this.__fileId = fileId;
    this.__citationReference = citationReference || (pageNumber ? `${exhibitId}:${pageNumber}` : exhibitId);
  }

  exportJSON(): SerializedCitationNode {
    return {
      type: 'citation',
      version: 1,
      exhibitId: this.__exhibitId,
      pageNumber: this.__pageNumber,
      description: this.__description,
      fileId: this.__fileId,
      citationReference: this.__citationReference,
    };
  }

  static importJSON(serializedNode: SerializedCitationNode): CitationNode {
    const { exhibitId, pageNumber, description, fileId, citationReference } = serializedNode;
    return $createCitationNode(exhibitId, pageNumber, description, fileId, citationReference);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    span.style.display = 'inline-block';
    span.style.userSelect = 'none';
    return span;
  }

  updateDOM(): false {
    return false;
  }

  getExhibitId(): string {
    return this.__exhibitId;
  }

  getPageNumber(): number | undefined {
    return this.__pageNumber;
  }

  getDescription(): string | undefined {
    return this.__description;
  }

  getFileId(): string | undefined {
    return this.__fileId;
  }

  getCitationReference(): string {
    return this.__citationReference;
  }

  setExhibitId(exhibitId: string): void {
    const writable = this.getWritable();
    writable.__exhibitId = exhibitId;
    writable.__citationReference = this.__pageNumber ? `${exhibitId}:${this.__pageNumber}` : exhibitId;
  }

  setPageNumber(pageNumber?: number): void {
    const writable = this.getWritable();
    writable.__pageNumber = pageNumber;
    writable.__citationReference = pageNumber ? `${this.__exhibitId}:${pageNumber}` : this.__exhibitId;
  }

  setDescription(description?: string): void {
    const writable = this.getWritable();
    writable.__description = description;
  }

  setFileId(fileId?: string): void {
    const writable = this.getWritable();
    writable.__fileId = fileId;
  }

  setCitationReference(citationReference: string): void {
    const writable = this.getWritable();
    writable.__citationReference = citationReference;
    
    // Parse the reference to update exhibitId and pageNumber
    const [exhibitId, pageStr] = citationReference.split(':');
    writable.__exhibitId = exhibitId;
    writable.__pageNumber = pageStr ? parseInt(pageStr, 10) : undefined;
  }

  isInline(): boolean {
    return true;
  }

  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    return (
      <CitationComponent
        exhibitId={this.__exhibitId}
        pageNumber={this.__pageNumber}
        description={this.__description}
        fileId={this.__fileId}
        citationReference={this.__citationReference}
        editor={editor}
        nodeKey={this.getKey()}
      />
    );
  }

  getTextContent(): string {
    return `[${this.__citationReference}]`;
  }
}

interface CitationComponentProps {
  exhibitId: string;
  pageNumber?: number;
  description?: string;
  fileId?: string;
  citationReference: string;
  editor: LexicalEditor;
  nodeKey: NodeKey;
}

const CitationComponent: React.FC<CitationComponentProps> = ({
  exhibitId,
  pageNumber,
  description,
  fileId,
  citationReference,
  editor,
  nodeKey
}) => {
  const citationText = `[${citationReference}]`;

  const handleClick = () => {
    editor.dispatchCommand(CITATION_CLICK_COMMAND, {
      exhibitId,
      pageNumber,
      fileId,
      citationReference
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <Chip
      label={citationText}
      size="small"
      clickable
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      icon={<LinkOutlined />}
      sx={{
        backgroundColor: '#e3f2fd',
        border: '1px solid #2563eb',
        borderRadius: '4px',
        color: '#1565c0',
        fontSize: '0.85rem',
        fontWeight: 600,
        height: '22px',
        margin: '0 2px',
        cursor: 'pointer',
        transition: 'all 120ms cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          backgroundColor: '#bbdefb',
          borderColor: '#1976d2',
          transform: 'scale(1.05)',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)',
        },
        '&:active': {
          transform: 'scale(0.98)',
        },
        '& .MuiChip-icon': {
          fontSize: '14px',
          marginLeft: '4px',
          color: '#1565c0',
        },
        '& .MuiChip-label': {
          paddingLeft: '6px',
          paddingRight: '8px',
          fontFamily: 'monospace',
        }
      }}
      title={description ? `${citationText}: ${description}` : `Citation to exhibit ${exhibitId}${pageNumber ? `, page ${pageNumber}` : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`Citation ${citationText}${description ? `: ${description}` : ''}`}
    />
  );
};

export function $createCitationNode(
  exhibitId: string,
  pageNumber?: number,
  description?: string,
  fileId?: string,
  citationReference?: string
): CitationNode {
  const citationNode = new CitationNode(exhibitId, pageNumber, description, fileId, citationReference);
  return $applyNodeReplacement(citationNode);
}

export function $isCitationNode(node: LexicalNode | null | undefined): node is CitationNode {
  return node instanceof CitationNode;
}

export default CitationNode;