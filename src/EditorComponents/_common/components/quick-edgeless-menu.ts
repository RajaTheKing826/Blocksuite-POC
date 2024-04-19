/* eslint-disable @typescript-eslint/no-restricted-imports */
import '@shoelace-style/shoelace/dist/components/button-group/button-group'
import '@shoelace-style/shoelace/dist/components/button/button'
import '@shoelace-style/shoelace/dist/components/color-picker/color-picker'
import '@shoelace-style/shoelace/dist/components/divider/divider'
import '@shoelace-style/shoelace/dist/components/dropdown/dropdown'
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button'
import '@shoelace-style/shoelace/dist/components/icon/icon'
import '@shoelace-style/shoelace/dist/components/menu-item/menu-item'
import '@shoelace-style/shoelace/dist/components/menu/menu'
import '@shoelace-style/shoelace/dist/components/select/select'
import '@shoelace-style/shoelace/dist/components/tab-group/tab-group'
import '@shoelace-style/shoelace/dist/components/tab/tab'
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip'
import '@shoelace-style/shoelace/dist/components/alert/alert'
import '@shoelace-style/shoelace/dist/themes/light.css'
import '@shoelace-style/shoelace/dist/themes/dark.css'
import '@shoelace-style/shoelace/dist/components/input/input'

import { ShadowlessElement } from '@blocksuite/block-std'
import { ColorVariables, extractCssVariables } from '@blocksuite/blocks'
import type { AffineEditorContainer } from '@blocksuite/presets'
import { type DocCollection } from '@blocksuite/store'
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path'
import { css, html } from 'lit'
import { customElement } from 'lit/decorators.js'

const cssVariablesMap = extractCssVariables(document.documentElement)
const plate: Record<string, string> = {}
ColorVariables.forEach((key: string) => {
   plate[key] = cssVariablesMap[key]
})

const basePath =
   'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.11.2/dist/'
setBasePath(basePath)

@customElement('quick-edgeless-menu')
export class QuickEdgelessMenu extends ShadowlessElement {
   static override styles = css`
      :root {
         --sl-font-size-medium: var(--affine-font-xs);
         --sl-input-font-size-small: var(--affine-font-xs);
      }

      .dg.ac {
         z-index: 1001 !important;
      }

      .top-container {
         display: flex;
         align-items: center;
         gap: 12px;
         font-size: 16px;
      }

      .debug-menu-icon {
         margin: 12px 0px 2px 0px;
      }

      .editor-mode-icon {
         margin: 8px 0px 8px 0px;
      }
   `

   collection!: DocCollection
   editor!: AffineEditorContainer
   isDisabled: boolean
   private _canUndo = false
   private _canRedo = false
   readonly = false
   private _dark
   private onChangeEditorMode = (editorMode: 'page' | 'edgeless') => {}
   private onChangeDarkMode = (isDarkMode: boolean) => {}

   static properties = {
      collection: { state: true, attribute: false },
      editor: { state: true, attribute: false },
      _canRedo: { state: true, attribute: false },
      _canUndo: { state: true, attribute: false },
      _dark: { state: true, attribute: false },
      readonly: { state: true, attribute: false },
      mode: { state: true, attribute: false },
      onChangeEditorMode: { state: true, attribute: false },
      isDisabled: { state: true, attribute: false }
   }

   constructor(props) {
      super()
      this.onChangeEditorMode = props.onChangeEditorMode
      this._dark = props.isDarkMode
      this.onChangeDarkMode = props.setIsDarkMode
      this.isDisabled = props.isDisabled
   }

   get mode() {
      return this.editor.mode
   }

   set mode(value: 'page' | 'edgeless') {
      this.editor.mode = value
   }

   get doc() {
      return this.editor.doc
   }

   get rootService() {
      return this.editor.host.spec.getService('affine:edgeless')
   }

   override createRenderRoot() {
      this._setThemeMode(this._dark)

      return this
   }

   override connectedCallback() {
      super.connectedCallback()
      document.body.addEventListener('keydown', this._keydown)
   }

   override disconnectedCallback() {
      super.disconnectedCallback()

      document.body.removeEventListener('keydown', this._keydown)
   }

   private _keydown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
         this._switchEditorMode()
      }
   }

   private _switchEditorMode() {
      this.mode = this.mode === 'page' ? 'edgeless' : 'page'
      this.onChangeEditorMode(this.mode)
   }

   private _setThemeMode(dark: boolean) {
      const html = document.querySelector('html')

      this._dark = dark
      this.onChangeDarkMode(dark)
      localStorage.setItem('blocksuite:dark', dark ? 'true' : 'false')
      if (!html) return
      html.dataset.theme = dark ? 'dark' : 'light'

      this._insertTransitionStyle('color-transition', 0)

      if (dark) {
         html.classList.add('dark')
         html.classList.add('sl-theme-dark')
      } else {
         html.classList.remove('dark')
         html.classList.remove('sl-theme-dark')
      }
   }

   private _insertTransitionStyle(classKey: string, duration: number) {
      const $html = document.documentElement
      const $style = document.createElement('style')
      const slCSSKeys = ['sl-transition-x-fast']
      $style.innerHTML = `html.${classKey} * { transition: all ${duration}ms 0ms linear !important; } :root { ${slCSSKeys.map(
         key => `--${key}: ${duration}ms`
      )} }`

      $html.append($style)
      $html.classList.add(classKey)

      setTimeout(() => {
         $style.remove()
         $html.classList.remove(classKey)
      }, duration)
   }

   private _toggleDarkMode() {
      const updatedValue = !this._dark
      this._setThemeMode(updatedValue)
      this.onChangeDarkMode(updatedValue)
   }

   override firstUpdated() {
      this.doc.slots.historyUpdated.on(() => {
         this._canUndo = this.doc.canUndo
         this._canRedo = this.doc.canRedo
      })
   }

   override update(changedProperties: Map<string, unknown>) {
      if (changedProperties.has('mode')) {
         const mode = this.mode
         this.editor.mode = mode
      }

      super.update(changedProperties)
   }

   updateIsDisabled(isDisabled: boolean) {
      this.isDisabled = isDisabled
   }

   override render() {
      return html`
         <style>
            .quick-edgeless-menu {
               display: flex;
               flex-wrap: nowrap;
               position: fixed;
               top: 0;
               left: 0;
               width: 100%;
               overflow: auto;
               z-index: 1000; /* for debug visibility */
               pointer-events: none;
            }

            @media print {
               .quick-edgeless-menu {
                  display: none;
               }
            }

            .default-toolbar {
               display: flex;
               gap: 5px;
               padding: 8px 8px 8px 16px;
               width: 100%;
               min-width: 390px;
               align-items: center;
               justify-content: space-between;
            }

            .default-toolbar sl-button.dots-menu::part(base) {
               color: var(--sl-color-neutral-700);
            }

            .default-toolbar sl-button.dots-menu::part(label) {
               padding-left: 0;
            }

            .default-toolbar > * {
               pointer-events: auto;
            }

            .edgeless-toolbar {
               align-items: center;
               margin-right: 17px;
               pointer-events: auto;
            }

            .edgeless-toolbar sl-select,
            .edgeless-toolbar sl-color-picker,
            .edgeless-toolbar sl-button {
               margin-right: 4px;
            }
         </style>
         <div class="quick-edgeless-menu default blocksuite-overlay">
            <div class="default-toolbar">
               <div class="top-container">
                  <sl-dropdown placement="bottom" hoist>
                     <sl-button
                        class="dots-menu"
                        variant="text"
                        size="small"
                        slot="trigger"
                        .disabled=${this.isDisabled}
                     >
                        <sl-icon
                           style="font-size: 14px"
                           name="three-dots-vertical"
                           label="Menu"
                        ></sl-icon>
                     </sl-button>
                     <sl-menu>
                        <sl-menu-item @click=${this._toggleDarkMode}>
                           Toggle ${this._dark ? 'Light' : 'Dark'} Mode
                           <sl-icon
                              slot="prefix"
                              name=${this._dark ? 'moon' : 'brightness-high'}
                           ></sl-icon>
                        </sl-menu-item>
                     </sl-menu>
                  </sl-dropdown>

                  <!-- undo/redo group -->
                  <sl-button-group label="History">
                     <!-- undo -->
                     <sl-tooltip content="Undo" placement="bottom" hoist>
                        <sl-button
                           pill
                           size="small"
                           content="Undo"
                           .disabled=${!this._canUndo || this.isDisabled}
                           @click=${() => {
                              this.doc.undo()
                           }}
                        >
                           <sl-icon
                              name="arrow-counterclockwise"
                              label="Undo"
                              class="debug-menu-icon"
                           ></sl-icon>
                        </sl-button>
                     </sl-tooltip>
                     <!-- redo -->
                     <sl-tooltip content="Redo" placement="bottom" hoist>
                        <sl-button
                           pill
                           size="small"
                           content="Redo"
                           .disabled=${!this._canRedo || this.isDisabled}
                           @click=${() => {
                              this.doc.redo()
                           }}
                        >
                           <sl-icon
                              name="arrow-clockwise"
                              label="Redo"
                              class="debug-menu-icon"
                           ></sl-icon>
                        </sl-button>
                     </sl-tooltip>
                  </sl-button-group>
               </div>

               <div>
                  <sl-button-group label="Mode" style="margin-right: 12px">
                     <!-- switch to page -->
                     <sl-tooltip content="Page" placement="bottom" hoist>
                        <sl-button
                           pill
                           size="small"
                           content="Page"
                           .disabled=${this.mode !== 'edgeless' ||
                           this.isDisabled}
                           @click=${this._switchEditorMode}
                        >
                           <svg
                              width="20"
                              height="20"
                              viewBox="0 0 20 20"
                              xmlns="http://www.w3.org/2000/svg"
                              class="editor-mode-icon"
                           >
                              <path
                                 fill-rule="evenodd"
                                 clip-rule="evenodd"
                                 d="M5.83341 2.7085C4.56776 2.7085 3.54175 3.73451 3.54175 5.00016V15.0002C3.54175 16.2658 4.56776 17.2918 5.83341 17.2918H14.1667C15.4324 17.2918 16.4584 16.2658 16.4584 15.0002V5.00016C16.4584 3.73451 15.4324 2.7085 14.1667 2.7085H5.83341ZM4.79175 5.00016C4.79175 4.42487 5.25812 3.9585 5.83341 3.9585H14.1667C14.742 3.9585 15.2084 4.42487 15.2084 5.00016V15.0002C15.2084 15.5755 14.742 16.0418 14.1667 16.0418H5.83341C5.25812 16.0418 4.79175 15.5755 4.79175 15.0002V5.00016ZM7.50008 6.04183C7.1549 6.04183 6.87508 6.32165 6.87508 6.66683C6.87508 7.01201 7.1549 7.29183 7.50008 7.29183H10.4167C10.7619 7.29183 11.0417 7.01201 11.0417 6.66683C11.0417 6.32165 10.7619 6.04183 10.4167 6.04183H7.50008ZM6.87508 9.5835C6.87508 9.23832 7.1549 8.9585 7.50008 8.9585H12.5001C12.8453 8.9585 13.1251 9.23832 13.1251 9.5835C13.1251 9.92867 12.8453 10.2085 12.5001 10.2085H7.50008C7.1549 10.2085 6.87508 9.92867 6.87508 9.5835ZM7.50008 11.8752C7.1549 11.8752 6.87508 12.155 6.87508 12.5002C6.87508 12.8453 7.1549 13.1252 7.50008 13.1252H11.6667C12.0119 13.1252 12.2917 12.8453 12.2917 12.5002C12.2917 12.155 12.0119 11.8752 11.6667 11.8752H7.50008Z"
                                 fill="currentColor"
                              ></path>
                           </svg>
                        </sl-button>
                     </sl-tooltip>
                     <!-- switch to edgeless -->
                     <sl-tooltip content="Edgeless" placement="bottom" hoist>
                        <sl-button
                           pill
                           size="small"
                           content="Edgeless"
                           .disabled=${this.mode !== 'page' || this.isDisabled}
                           @click=${this._switchEditorMode}
                        >
                           <svg
                              width="20"
                              height="20"
                              viewBox="0 0 20 20"
                              xmlns="http://www.w3.org/2000/svg"
                              class="editor-mode-icon"
                           >
                              <path
                                 fill-rule="evenodd"
                                 clip-rule="evenodd"
                                 d="M5.97361 3.9585C5.11378 3.9585 4.41675 4.65553 4.41675 5.51536C4.41675 6.37519 5.11378 7.07222 5.97361 7.07222C6.83344 7.07222 7.53047 6.37519 7.53047 5.51536C7.53047 4.65553 6.83344 3.9585 5.97361 3.9585ZM3.16675 5.51536C3.16675 3.96517 4.42342 2.7085 5.97361 2.7085C7.46041 2.7085 8.67721 3.8645 8.77424 5.32674C9.47625 5.32742 10.1504 5.3384 10.8518 5.50781C11.6295 5.69568 12.4061 6.06747 13.3306 6.76082L13.3476 6.77356L13.3637 6.78743C14.6691 7.91276 15.3225 9.73181 15.3261 11.4359H16.7085C17.0536 11.4359 17.3335 11.7157 17.3335 12.0609V15.9883C17.3335 16.3334 17.0536 16.6133 16.7085 16.6133H12.7811C12.4359 16.6133 12.1561 16.3334 12.1561 15.9883V12.0609C12.1561 11.7157 12.4359 11.4359 12.7811 11.4359H14.0761C14.0724 10.0149 13.523 8.58544 12.5631 7.74773C11.7507 7.14103 11.1313 6.86129 10.5583 6.72287C9.96522 6.57962 9.38587 6.5767 8.59186 6.5767V6.52901C8.25859 7.38925 7.51359 8.04431 6.59865 8.25237V11.5058C7.84798 11.7899 8.78047 12.9074 8.78047 14.2428C8.78047 15.793 7.5238 17.0496 5.97361 17.0496C4.42342 17.0496 3.16675 15.793 3.16675 14.2428C3.16675 12.9074 4.09928 11.7898 5.34865 11.5057V8.25239C4.09928 7.96831 3.16675 6.85074 3.16675 5.51536ZM5.97361 12.6859C5.11378 12.6859 4.41675 13.3829 4.41675 14.2428C4.41675 15.1026 5.11378 15.7996 5.97361 15.7996C6.83344 15.7996 7.53047 15.1026 7.53047 14.2428C7.53047 13.3829 6.83344 12.6859 5.97361 12.6859ZM13.4061 15.3633V12.6859H16.0835V15.3633H13.4061Z"
                                 fill="currentColor"
                              ></path>
                           </svg>
                        </sl-button>
                     </sl-tooltip>
                  </sl-button-group>
               </div>
            </div>
         </div>
      `
   }
}

declare global {
   interface HTMLElementTagNameMap {
      'quick-edgeless-menu': QuickEdgelessMenu
   }
}
