import { useState } from "react";
import { Badge } from "./badge";
import { Button } from "./button";
import { X, Plus } from "lucide-react";

interface MultiSelectHashtagsProps {
  availableHashtags: string[];
  selectedHashtags: string[];
  onSelectionChange: (hashtags: string[]) => void;
}

export function MultiSelectHashtags({ 
  availableHashtags, 
  selectedHashtags, 
  onSelectionChange 
}: MultiSelectHashtagsProps) {
  const handleToggleHashtag = (hashtag: string) => {
    const isSelected = selectedHashtags.includes(hashtag);
    if (isSelected) {
      onSelectionChange(selectedHashtags.filter(h => h !== hashtag));
    } else {
      onSelectionChange([...selectedHashtags, hashtag]);
    }
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="space-y-3">
      {selectedHashtags.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Selected ({selectedHashtags.length})
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearAll}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear All
          </Button>
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        {availableHashtags.map((hashtag) => {
          const isSelected = selectedHashtags.includes(hashtag);
          return (
            <Button
              key={hashtag}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => handleToggleHashtag(hashtag)}
              className="h-8 text-xs"
            >
              {isSelected ? (
                <>
                  <X className="h-3 w-3 mr-1" />
                  #{hashtag}
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3 mr-1" />
                  #{hashtag}
                </>
              )}
            </Button>
          );
        })}
      </div>
      
      {selectedHashtags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          {selectedHashtags.map((hashtag) => (
            <Badge
              key={hashtag}
              variant="secondary"
              className="text-xs py-1 px-2"
            >
              #{hashtag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}