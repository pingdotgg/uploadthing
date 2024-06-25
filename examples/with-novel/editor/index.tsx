"use client";

import React, { useEffect, useState } from "react";
import { uploadFn } from "@/uploadthing/novel-plugin";
import {
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  EditorContent,
  EditorInstance,
  EditorRoot,
  type JSONContent,
} from "novel";
import { handleCommandNavigation, ImageResizer } from "novel/extensions";
import { handleImageDrop, handleImagePaste } from "novel/plugins";
import { useDebouncedCallback } from "use-debounce";

import { defaultExtensions } from "./extensions";
import { slashCommand, suggestionItems } from "./slash-command";

const extensions = [...defaultExtensions, slashCommand];

export const AdvancedEditor = () => {
  const [initialContent, setInitialContent] = useState<null | JSONContent>(
    null,
  );
  const [saveStatus, setSaveStatus] = useState("Saved");

  const debouncedUpdates = useDebouncedCallback(
    async (editor: EditorInstance) => {
      const json = editor.getJSON();

      window.localStorage.setItem("novel-content", JSON.stringify(json));
      setSaveStatus("Saved");
    },
    500,
  );

  useEffect(() => {
    const content = window.localStorage.getItem("novel-content");
    if (content) setInitialContent(JSON.parse(content));
    else setInitialContent(defaultEditorContent);
  }, []);

  if (!initialContent) return null;

  return (
    <div className="relative w-full max-w-screen-lg">
      <div className="bg-accent text-muted-foreground absolute right-5 top-5 z-10 mb-5 rounded-lg px-2 py-1 text-sm">
        {saveStatus}
      </div>
      <EditorRoot>
        <EditorContent
          initialContent={initialContent}
          extensions={extensions}
          className="border-muted bg-background relative min-h-[500px] w-full max-w-screen-lg sm:mb-[calc(20vh)] sm:rounded-lg sm:border sm:shadow-lg"
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event),
            },
            handlePaste: (view, event) =>
              handleImagePaste(view, event, uploadFn),
            handleDrop: (view, event, _slice, moved) =>
              handleImageDrop(view, event, moved, uploadFn),
            attributes: {
              class: `prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full`,
            },
          }}
          onUpdate={({ editor }) => {
            debouncedUpdates(editor);
            setSaveStatus("Unsaved");
          }}
          slotAfter={<ImageResizer />}
        >
          <EditorCommand className="border-muted bg-background z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border px-1 py-2 shadow-md transition-all">
            <EditorCommandEmpty className="text-muted-foreground px-2">
              No results
            </EditorCommandEmpty>
            <EditorCommandList>
              {suggestionItems.map((item) => (
                <EditorCommandItem
                  value={item.title}
                  onCommand={(val) => item.command?.(val)}
                  className={`hover:bg-accent aria-selected:bg-accent flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm`}
                  key={item.title}
                >
                  <div className="border-muted bg-background flex h-10 w-10 items-center justify-center rounded-md border">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.description}
                    </p>
                  </div>
                </EditorCommandItem>
              ))}
            </EditorCommandList>
          </EditorCommand>
        </EditorContent>
      </EditorRoot>
    </div>
  );
};

const defaultEditorContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Novel x UploadThing" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "This is a stripped down example based on ",
        },
        {
          type: "text",
          marks: [
            {
              type: "link",
              attrs: {
                href: "https://github.com/steven-tey/novel/apps/web",
                target: "_blank",
              },
            },
          ],
          text: "the official Novel web app",
        },
        {
          type: "text",
          text: " showing how to integrate it with UploadThing.",
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Installation" }],
    },
    {
      type: "codeBlock",
      attrs: { language: null },
      content: [
        { type: "text", text: "npm i novel uploadthing @uploadthing/react" },
      ],
    },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Try uploading something by" }],
    },
    {
      type: "taskList",
      content: [
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Copy-Pasting an image" }],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Drag and drop an image" }],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Using the Image command from the slash menu",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "image",
      attrs: {
        src: "https://docs.uploadthing.com/og.jpg",
        alt: "banner.png",
        title: "banner.png",
        width: null,
        height: null,
      },
    },
    { type: "horizontalRule" },
  ],
};
