"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { Bold, Italic, List, ListOrdered, Quote, Code, Link, ImageIcon, Table } from "lucide-react"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Enter your content...",
  className = "",
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState("write")

  const insertMarkdown = (before: string, after = "") => {
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)

    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)

    onChange(newText)

    // Set cursor position
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + before.length + selectedText.length + after.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const toolbarButtons = [
    { icon: Bold, label: "Bold", action: () => insertMarkdown("**", "**") },
    { icon: Italic, label: "Italic", action: () => insertMarkdown("*", "*") },
    { icon: Code, label: "Code", action: () => insertMarkdown("`", "`") },
    { icon: Quote, label: "Quote", action: () => insertMarkdown("> ") },
    { icon: List, label: "Bullet List", action: () => insertMarkdown("- ") },
    { icon: ListOrdered, label: "Numbered List", action: () => insertMarkdown("1. ") },
    { icon: Link, label: "Link", action: () => insertMarkdown("[", "](url)") },
    { icon: ImageIcon, label: "Image", action: () => insertMarkdown("![alt](", ")") },
    {
      icon: Table,
      label: "Table",
      action: () => insertMarkdown("\n| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n"),
    },
  ]

  return (
    <div className={`border rounded-lg ${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between border-b px-3 py-2">
          <TabsList className="grid w-fit grid-cols-2">
            <TabsTrigger value="write">Write</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {activeTab === "write" && (
            <div className="flex items-center gap-1">
              {toolbarButtons.map((button, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={button.action}
                  title={button.label}
                  className="h-8 w-8 p-0"
                >
                  <button.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
          )}
        </div>

        <TabsContent value="write" className="m-0">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-[200px] border-0 resize-none focus-visible:ring-0"
          />
        </TabsContent>

        <TabsContent value="preview" className="m-0">
          <div className="min-h-[200px] p-3">
            {value ? <MarkdownRenderer content={value} /> : <p className="text-muted-foreground">Nothing to preview</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
