import { DocSnapshot, type DocCollection } from '@blocksuite/store'

export interface InitFn {
   (
      collection: DocCollection,
      docId: string,
      initialContent?: DocSnapshot
   ): Promise<void> | void
   id: string
   displayName: string
   description: string
}
