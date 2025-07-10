"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Eye, Edit, HelpCircle } from "lucide-react"
import { MarkdownRenderer } from "./markdown-renderer"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}

export function MarkdownEditor({ value, onChange, placeholder = "Enter markdown...", rows = 6 }: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState("edit")

  const insertMarkdown = (syntax: string, placeholder = "text") => {
    const textarea = document.querySelector("textarea[data-markdown-editor]") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const replacement = syntax.replace(placeholder, selectedText || placeholder)

    const newValue = value.substring(0, start) + replacement + value.substring(end)
    onChange(newValue)

    // Set cursor position
    setTimeout(() => {
      const newCursorPos = start + replacement.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      textarea.focus()
    }, 0)
  }

  const markdownHelp = `
# Markdown Guide

## Headers
# H1 Header
## H2 Header  
### H3 Header

## Text Formatting
**Bold text**
*Italic text*
~~Strikethrough~~
\`Inline code\`

## Lists
- Bullet point 1
- Bullet point 2

1. Numbered item 1
2. Numbered item 2

## Links & Images
[Link text](https://example.com)
![Image alt text](image-url)

## Code Blocks
\`\`\`javascript
function hello() {
  console.log("Hello World!");
}
\`\`\`

## Tables
| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |

## Quotes
> This is a blockquote

## Task Lists
- [x] Completed task
- [ ] Incomplete task
  `

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit" className="flex items-center space-x-2">
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Markdown Guide</DialogTitle>
            </DialogHeader>
            <MarkdownRenderer content={markdownHelp} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="edit" className="space-y-2">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-gray-50">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown("**text**", "text")}
              title="Bold"
            >
              <strong>B</strong>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown("*text*", "text")}
              title="Italic"
            >
              <em>I</em>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown("`text`", "text")}
              title="Code"
            >
              {"</>"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown("[text](url)", "text")}
              title="Link"
            >
              🔗
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown("- text", "text")}
              title="List"
            >
              •
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown("> text", "text")}
              title="Quote"
            >
              "
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown("```\ntext\n```", "text")}
              title="Code Block"
            >
              {"{}"}
            </Button>
          </div>

          <Textarea
            data-markdown-editor
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="font-mono text-sm"
          />
        </TabsContent>

        <TabsContent value="preview">
          <div className="min-h-[200px] p-4 border rounded-md bg-white">
            {value ? <MarkdownRenderer content={value} /> : <p className="text-gray-500 italic">Nothing to preview</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
