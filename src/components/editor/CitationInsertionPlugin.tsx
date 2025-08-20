/**
 * CitationInsertionPlugin - Plugin to handle external citation insertion events
 * 
 * This plugin listens for window 'insertCitation' events and dispatches
 * INSERT_CITATION_COMMAND to the Lexical editor.
 */
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { INSERT_CITATION_COMMAND, CitationPayload } from './CitationNode';

export const CitationInsertionPlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handleCitationInsertionEvent = (event: CustomEvent) => {
      const { exhibitId, pageNumber, citationReference, description, fileId } = event.detail;
      
      console.log('CitationInsertionPlugin: Received citation insertion event', event.detail);
      
      const payload: CitationPayload = {
        exhibitId,
        pageNumber,
        citationReference,
        description,
        fileId,
      };
      
      // Dispatch the citation insertion command to the editor
      editor.dispatchCommand(INSERT_CITATION_COMMAND, payload);
    };

    // Listen for citation insertion events
    window.addEventListener('insertCitation', handleCitationInsertionEvent as EventListener);
    
    return () => {
      window.removeEventListener('insertCitation', handleCitationInsertionEvent as EventListener);
    };
  }, [editor]);

  return null; // This plugin doesn't render anything
};

export default CitationInsertionPlugin;