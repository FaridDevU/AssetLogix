import { useState } from "react";
import { Button } from "@/components/ui/button";
import FileExplorer from "@/components/FileExplorer";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import DocumentViewer from "@/components/DocumentViewer";

export default function DocsExplorer() {
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);

  return (
    <div className="h-full">
      <FileExplorer />
      
      {/* Document viewer dialog - in a real app, we'd call this when a document is clicked */}
      {selectedDocumentId && (
        <Dialog open={!!selectedDocumentId} onOpenChange={(open) => !open && setSelectedDocumentId(null)}>
          <DialogContent className="sm:max-w-4xl">
            <DocumentViewer 
              documentId={selectedDocumentId} 
              onClose={() => setSelectedDocumentId(null)} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
