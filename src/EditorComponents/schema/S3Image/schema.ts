import { ImageBlockProps, ImageService } from "@blocksuite/blocks";
import type {
  FromSnapshotPayload,
  SnapshotReturn,
  ToSnapshotPayload,
} from "@blocksuite/store";
import { BaseBlockTransformer } from "@blocksuite/store";
import { BlockModel } from "@blocksuite/store";
import { selectable } from "@blocksuite/blocks/dist/_common/edgeless/mixin/edgeless-selectable";
import { defineBlockSchema } from "@blocksuite/store";

interface S3ImageBlockProps extends ImageBlockProps {
  s3Url?: string;
}

export class S3ImageBlockModel extends selectable<S3ImageBlockProps>(
  BlockModel
) {}

export class S3ImageService extends ImageService {}

export class S3ImageBlockTransformer extends BaseBlockTransformer<S3ImageBlockProps> {
  override async toSnapshot(payload: ToSnapshotPayload<S3ImageBlockProps>) {
    const snapshot = await super.toSnapshot(payload);

    return snapshot;
  }

  override async fromSnapshot(
    payload: FromSnapshotPayload
  ): Promise<SnapshotReturn<S3ImageBlockProps>> {
    const snapshotRet = await super.fromSnapshot(payload);

    return snapshotRet;
  }
}

const defaultImageProps: S3ImageBlockProps = {
  caption: "",
  sourceId: "",
  width: 0,
  height: 0,
  index: "a0",
  xywh: "[0,0,0,0]",
  rotate: 0,
  size: -1,
  s3Url: "",
};

export const S3ImageBlockSchema = defineBlockSchema({
  flavour: "affine:image",
  props: () => defaultImageProps,
  metadata: {
    version: 1,
    role: "content",
  },
  transformer: () => new S3ImageBlockTransformer(),
  toModel: () => new S3ImageBlockModel(),
});
