import { html } from 'lit'
import { customElement } from 'lit/decorators.js'

import { BlockElement } from '@blocksuite/block-std'
import {
   APIStatus,
   API_FAILED,
   API_FETCHING,
   API_INITIAL,
   API_SUCCESS
} from '@ib/api-constants'
import { isAPIFetching } from '@ib/api-utils'
import {
   S3FileUploader,
   bucketPath,
   commonStores
} from '@hive-frontend/hive/common'

import { S3ImageBlockModel, S3ImageService } from './schema'

@customElement('affine-s3-image')
export class S3ImageBlockComponent extends BlockElement<
   S3ImageBlockModel,
   S3ImageService
> {
   apiStatus: APIStatus = this.model?.s3Url ? API_SUCCESS : API_INITIAL

   static properties = {
      apiStatus: { state: true }
   }

   updateAPIStatus = (status: APIStatus) => {
      this.apiStatus = status
   }

   onSuccessUploadToAWS = (status: APIStatus, location: string) => {
      this.model.s3Url = location
      this.updateAPIStatus(status)
   }

   onSuccessGetFileUploadConfigAPI = (file: File) => {
      const s3FileUpload = new S3FileUploader(commonStores.fileUploadStore)
      s3FileUpload.configureAWS()
      s3FileUpload.uploadToAWS(
         {
            file: file,
            extraBucketPath: bucketPath.advancedWhiteboardAssets
         },
         this.onSuccessUploadToAWS,
         (status: APIStatus) => {
            this.updateAPIStatus(status)
         }
      )
   }

   uploadFileToS3 = (file: File) => {
      this.updateAPIStatus(API_FETCHING)

      commonStores.fileUploadStore.getFileUploadConfigAPI(
         () => {
            this.onSuccessGetFileUploadConfigAPI(file)
         },
         () => {
            this.updateAPIStatus(API_FAILED)
         }
      )
   }

   insertParagraphEl = (): void => {
      const parentBlock = this.doc.getParent(this.model.id)
      const isParentNoteBlock = parentBlock?.flavour === 'affine:note'

      if (isParentNoteBlock) {
         this.doc.addBlock('affine:paragraph', {}, parentBlock)
      }
   }

   uploadImageFileToS3 = async (sourceId: string) => {
      const blob = await this.doc.blob.get(sourceId)

      this.model.sourceId = ''

      if (blob) {
         const fileName = 'url'
         const file = new File([blob], fileName, {
            type: blob.type
         })

         const shouldUploadFileToS3 =
            !this.model.s3Url && file && !isAPIFetching(this.apiStatus)

         if (shouldUploadFileToS3) {
            this.uploadFileToS3(file)
         }
      }
   }

   override connectedCallback() {
      super.connectedCallback()

      if (this.model.s3Url) {
         this.updateAPIStatus(API_SUCCESS)
      }

      this.insertParagraphEl()

      if (this.model.sourceId) {
         this.uploadImageFileToS3(this.model.sourceId)
         return
      }

      this.model.propsUpdated.on(async () => {
         if (this.model.sourceId) {
            this.uploadImageFileToS3(this.model.sourceId)
         }
      })
   }

   render() {
      return html`<div
         class="affine-s3-image h-full flex flex-col justify-center items-center relative z-l1 min-h-[300px]"
      >
         ${this.apiStatus === API_SUCCESS
            ? html` <img class="drag-target" src=${this.model.s3Url ?? ''} />`
            : this.apiStatus === API_FAILED
              ? html`<p>API Failed</p>`
              : this.apiStatus === API_INITIAL ||
                  this.apiStatus === API_FETCHING
                ? html`<svg
                     width="30"
                     height="30"
                     viewBox="25 25 50 50"
                     stroke-width="5"
                     class="common-ring-loader"
                  >
                     <circle cx="50" cy="50" r="20" stroke="#3b82f6"></circle>
                  </svg>`
                : null}
      </div>`
   }
}
