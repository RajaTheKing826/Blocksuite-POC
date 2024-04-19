import {
  AffineFormatBarWidget,
  EdgelessEditorBlockSpecs,
  PageEditorBlockSpecs,
  toolbarDefaultConfig,
} from "@blocksuite/blocks";
import { assertExists } from "@blocksuite/global/utils";
import {
  AffineEditorContainer,
  affineFormatBarItemConfig,
} from "@blocksuite/presets";
import type { DocCollection } from "@blocksuite/store";
import { literal } from "lit/static-html.js";

import { S3ImageBlockSchema, S3ImageService } from "../schema/S3Image/schema";
import { S3ImageBlockComponent } from "../schema/S3Image";
import { QuickEdgelessMenu } from "../_common/components/quick-edgeless-menu";

function configureFormatBar(formatBar: AffineFormatBarWidget) {
  toolbarDefaultConfig(formatBar);

  formatBar.addRawConfigItems(
    [affineFormatBarItemConfig, { type: "divider" }],
    0
  );
}

export async function mountDefaultDocEditor(
  collection: DocCollection,
  editorMode: "page" | "edgeless",
  isDarkMode: boolean,
  setIsDarkMode: (isDarkMode: boolean) => void,
  onChangeEditorMode?: (mode: "page" | "edgeless") => void,
  isDisabled?: boolean
) {
  const doc = collection.docs.values().next().value;
  assertExists(doc, "Need to create a doc first");

  assertExists(doc.ready, "Doc is not ready");
  assertExists(doc.root, "Doc root is not ready");

  const app = document.getElementById("app");
  if (!app) return;

  //@ts-ignore
  const editor = new AffineEditorContainer(editorMode);
  editor.pageSpecs = [...PageEditorBlockSpecs].map((spec) => {
    if (spec.schema.model.flavour === "affine:page") {
      const setup = spec.setup;
      spec = {
        ...spec,
        setup: (slots, disposable) => {
          setup?.(slots, disposable);

          const onFormatBarConnected = slots.widgetConnected.on((view) => {
            if (view.component instanceof AffineFormatBarWidget) {
              configureFormatBar(view.component);
            }
          });

          disposable.add(onFormatBarConnected);
        },
      };
    }
    return spec;
  });
  editor.edgelessSpecs = [...EdgelessEditorBlockSpecs].map((spec) => {
    if (spec.schema.model.flavour === "affine:page") {
      spec = {
        ...spec,
        setup: (slots, disposable) => {
          slots.mounted.once(() => {
            const onFormatBarConnected = slots.widgetConnected.on((view) => {
              if (view.component instanceof AffineFormatBarWidget) {
                configureFormatBar(view.component);
              }
            });

            disposable.add(onFormatBarConnected);
          });
        },
      };
    }
    return spec;
  });
  editor.doc = doc;

  const s3ImageSpec = {
    schema: S3ImageBlockSchema,
    service: S3ImageService,
    view: {
      component: literal`affine-s3-image`,
      widgets: {
        imageToolbar: literal`affine-image-toolbar-widget`,
      },
    },
  };

  const filteredEdgelessEditorBlockSpecs = EdgelessEditorBlockSpecs.filter(
    (blockSpec) => blockSpec.schema.model.flavour !== "affine:image"
  );
  editor.edgelessSpecs = [...filteredEdgelessEditorBlockSpecs, s3ImageSpec];
  const filteredPageEditorBlockSpecs = PageEditorBlockSpecs.filter(
    (blockSpec) => blockSpec.schema.model.flavour !== "affine:image"
  );
  editor.pageSpecs = [...filteredPageEditorBlockSpecs, s3ImageSpec];

  editor.slots.docLinkClicked.on(({ docId }) => {
    const target = collection.getDoc(docId);
    if (!target) {
      throw new Error(`Failed to jump to doc ${docId}`);
    }
    target.load();
    editor.doc = target;
  });

  app.append(editor);
  await editor.updateComplete;

  const quickEdgelessMenu = new QuickEdgelessMenu({
    onChangeEditorMode,
    isDarkMode,
    setIsDarkMode,
    isDisabled,
  });
  quickEdgelessMenu.collection = doc.collection;
  quickEdgelessMenu.editor = editor;
  editor.appendChild(quickEdgelessMenu);

  //FIXME: need to find out better way to make s3 image block component file read
  const s3ImageBlock = new S3ImageBlockComponent();

  return { editor, quickEdgelessMenu };
}
