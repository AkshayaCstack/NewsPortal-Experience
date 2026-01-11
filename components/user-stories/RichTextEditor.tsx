"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface RichTextEditorProps {
  value: any;
  onChange: (content: any) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  // Initialize content
  useEffect(() => {
    if (editorRef.current && value && !editorRef.current.innerHTML) {
      // If value has content, render it
      if (typeof value === 'object' && value.children) {
        // JSON RTE format - convert to HTML
        editorRef.current.innerHTML = convertToHtml(value);
      } else if (typeof value === 'string') {
        editorRef.current.innerHTML = value;
      }
      checkEmpty();
    }
  }, [value]);

  const checkEmpty = useCallback(() => {
    if (editorRef.current) {
      const content = editorRef.current.innerText.trim();
      setIsEmpty(content === "" || content === placeholder);
    }
  }, [placeholder]);

  const updateActiveFormats = useCallback(() => {
    const formats = new Set<string>();
    
    if (document.queryCommandState("bold")) formats.add("bold");
    if (document.queryCommandState("italic")) formats.add("italic");
    if (document.queryCommandState("underline")) formats.add("underline");
    
    const block = document.queryCommandValue("formatBlock");
    if (block === "h2") formats.add("h2");
    if (block === "h3") formats.add("h3");
    if (block === "blockquote") formats.add("quote");
    
    if (document.queryCommandState("insertUnorderedList")) formats.add("ul");
    if (document.queryCommandState("insertOrderedList")) formats.add("ol");
    
    setActiveFormats(formats);
  }, []);

  const handleInput = useCallback(() => {
    checkEmpty();
    updateActiveFormats();
    
    if (editorRef.current) {
      // Convert HTML to JSON structure for storage
      const content = convertToJson(editorRef.current.innerHTML);
      onChange(content);
    }
  }, [checkEmpty, updateActiveFormats, onChange]);

  const handleSelectionChange = useCallback(() => {
    updateActiveFormats();
  }, [updateActiveFormats]);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [handleSelectionChange]);

  const execCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
  };

  const formatBlock = (tag: string) => {
    editorRef.current?.focus();
    document.execCommand("formatBlock", false, tag);
    handleInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case "b":
          e.preventDefault();
          execCommand("bold");
          break;
        case "i":
          e.preventDefault();
          execCommand("italic");
          break;
        case "u":
          e.preventDefault();
          execCommand("underline");
          break;
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    handleInput();
  };

  return (
    <div className="rich-text-editor">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button
            type="button"
            className={`toolbar-btn ${activeFormats.has("bold") ? "active" : ""}`}
            onClick={() => execCommand("bold")}
            title="Bold (⌘B)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
            </svg>
          </button>
          <button
            type="button"
            className={`toolbar-btn ${activeFormats.has("italic") ? "active" : ""}`}
            onClick={() => execCommand("italic")}
            title="Italic (⌘I)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
            </svg>
          </button>
          <button
            type="button"
            className={`toolbar-btn ${activeFormats.has("underline") ? "active" : ""}`}
            onClick={() => execCommand("underline")}
            title="Underline (⌘U)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/>
            </svg>
          </button>
        </div>

        <div className="toolbar-divider"></div>

        <div className="toolbar-group">
          <button
            type="button"
            className={`toolbar-btn ${activeFormats.has("h2") ? "active" : ""}`}
            onClick={() => formatBlock("h2")}
            title="Heading"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 4v3h5.5v12h3V7H19V4z"/>
            </svg>
          </button>
          <button
            type="button"
            className={`toolbar-btn ${activeFormats.has("quote") ? "active" : ""}`}
            onClick={() => formatBlock("blockquote")}
            title="Quote"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
            </svg>
          </button>
        </div>

        <div className="toolbar-divider"></div>

        <div className="toolbar-group">
          <button
            type="button"
            className={`toolbar-btn ${activeFormats.has("ul") ? "active" : ""}`}
            onClick={() => execCommand("insertUnorderedList")}
            title="Bullet List"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
            </svg>
          </button>
          <button
            type="button"
            className={`toolbar-btn ${activeFormats.has("ol") ? "active" : ""}`}
            onClick={() => execCommand("insertOrderedList")}
            title="Numbered List"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/>
            </svg>
          </button>
        </div>

        <div className="toolbar-divider"></div>

        <div className="toolbar-group">
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => execCommand("removeFormat")}
            title="Clear Formatting"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.27 5L2 6.27l6.97 6.97L6.5 19h3l1.57-3.66L16.73 21 18 19.73 3.27 5zM6 5v.18L8.82 8h2.4l-.72 1.68 2.1 2.1L14.21 8H20V5H6z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="editor-container">
        <div
          ref={editorRef}
          className={`editor-content ${isEmpty ? "empty" : ""}`}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => {
            if (isEmpty && editorRef.current) {
              editorRef.current.innerHTML = "";
            }
          }}
          onBlur={checkEmpty}
          data-placeholder={placeholder}
          suppressContentEditableWarning
        />
      </div>
    </div>
  );
}

// Convert HTML to JSON structure (for Contentstack RTE compatibility)
function convertToJson(html: string): any {
  return {
    type: "doc",
    uid: "doc",
    children: [
      {
        type: "paragraph",
        children: [
          {
            text: html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
          }
        ]
      }
    ],
    _htmlContent: html // Store the raw HTML for rendering
  };
}

// Convert JSON back to HTML
function convertToHtml(json: any): string {
  if (json._htmlContent) {
    return json._htmlContent;
  }
  
  // Simple text extraction
  if (json.children) {
    return json.children
      .map((child: any) => {
        if (child.text) return child.text;
        if (child.children) return convertToHtml(child);
        return "";
      })
      .join("");
  }
  
  return "";
}

