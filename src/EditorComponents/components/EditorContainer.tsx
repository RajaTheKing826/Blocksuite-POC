import { useEffect, useState } from "react";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports

import "reflect-metadata";
import * as blocks from "@blocksuite/blocks";
import * as globalUtils from "@blocksuite/global/utils";
import * as editor from "@blocksuite/presets";
import * as store from "@blocksuite/store";
import { AffineEditorContainer } from "@blocksuite/presets";
import { DocSnapshot } from "@blocksuite/store";
import "@toeverything/theme/style.css";

import { QuickEdgelessMenu } from "../_common/components/quick-edgeless-menu";
import { slot } from "../slot/slot";
import { mountDefaultDocEditor } from "../utils/editor";
import {
  createStarterDocCollection,
  initStarterDocCollection,
} from "../utils/collection";
import "./index.css";

async function main(
  editorMode: "page" | "edgeless",
  isDarkMode: boolean,
  setIsDarkMode: (isDarkMode: boolean) => void,
  initialContent?: DocSnapshot,
  onChangeEditorMode?: (mode: "page" | "edgeless") => void,
  isDisabled?: boolean
) {
  // eslint-disable-next-line no-restricted-globals
  const params = new URLSearchParams(location.search);
  const room = params.get("room") ?? Math.random().toString(16).slice(2, 8);
  const isE2E = room.startsWith("playwright");
  const collection = createStarterDocCollection();

  if (isE2E) {
    Object.defineProperty(window, "$blocksuite", {
      value: Object.freeze({
        store,
        blocks,
        global: { utils: globalUtils },
        editor,
      }),
    });
    return;
  }

  await initStarterDocCollection(collection, initialContent);
  const editorInstance = await mountDefaultDocEditor(
    collection,
    editorMode,
    isDarkMode,
    setIsDarkMode,
    onChangeEditorMode,
    isDisabled
  );
  return editorInstance;
}

interface Props {
  initialContent?: DocSnapshot;
  setEditor: (editor: AffineEditorContainer) => void;
  isDisabled?: boolean;
  editorMode?: "page" | "edgeless";
  onChangeEditorMode?: (mode: "page" | "edgeless") => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDarkMode: boolean) => void;
  onClickCard: (cardId: string) => void;
}

export const EditorContainer = (props: Props) => {
  const {
    isDisabled = true,
    editorMode = "edgeless",
    onChangeEditorMode,
    isDarkMode,
    setIsDarkMode,
    onClickCard,
  } = props;

  const [editor, setEditor] = useState<undefined | AffineEditorContainer>(
    undefined
  );
  const [quickEdgelessMenu, setQuickEdgelessMenu] = useState<
    undefined | QuickEdgelessMenu
  >(undefined);

  useEffect(() => {
    slot.on(({ cardId }) => onClickCard(cardId));
  }, []);

  useEffect(() => {
    async function initEditor(initialContent?: DocSnapshot) {
      //@ts-ignore
      const { editor, quickEdgelessMenu } = await main(
        editorMode,
        isDarkMode,
        setIsDarkMode,
        initialContent,
        onChangeEditorMode,
        isDisabled
      );
      setEditor(editor);
      setQuickEdgelessMenu(quickEdgelessMenu);

      setTimeout(() => {
        const richText = editor?.querySelectorAll("rich-text");
        const lastRichText = richText?.[richText.length - 1];
        const inlineEditor = lastRichText?.inlineEditor;
        inlineEditor?.focusEnd();
      }, 100); //FIXME: need to find better solution for this

      if (editor) {
        props.setEditor(editor);
      }
    }
    initEditor(props.initialContent);
  }, []);

  useEffect(() => {
    if (editor) {
      editor.doc.awarenessStore.setReadonly(editor.doc, isDisabled);
      if (!quickEdgelessMenu) return;
      quickEdgelessMenu.updateIsDisabled(isDisabled);
    }
  }, [isDisabled, editor]);

  useEffect(() => {
    if (editor) {
      editor.mode = editorMode;
    }
  }, [editorMode, editor]);

  return <div className="w-full" />;
};
