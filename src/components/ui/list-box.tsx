'use client'

import { CheckIcon } from 'lucide-react'
import type React from 'react'
import { use } from 'react'
import { composeRenderProps } from 'react-aria-components/composeRenderProps'
import * as ListBoxPrimitive from 'react-aria-components/ListBox'
import type * as TextPrimitive from 'react-aria-components/Text'
import * as VirtualizerPrimitive from 'react-aria-components/Virtualizer'
import type { VariantProps } from 'tailwind-variants'
import { tv } from 'tailwind-variants'

import { Loader } from '@/components/ui/loader'

const listBoxVariants = tv({
  slots: {
    root: `
      max-h-[inherit] scroll-my-1 overflow-y-auto p-1 text-sm outline-hidden
      **:data-separator:-mx-1 **:data-separator:my-1 **:data-separator:w-auto
      layout-grid:grid layout-grid:gap-1
      layout-grid:orientation-horizontal:grid-flow-col
      layout-grid:orientation-horizontal:grid-rows-2
      layout-stack:orientation-horizontal:flex
      layout-stack:orientation-horizontal:flex-row
      layout-grid:orientation-vertical:grid-cols-2
    `,
    item: `
      relative flex w-full cursor-interactive items-center gap-2 rounded-md
      px-1.5 py-1 text-sm outline-hidden select-ui
      hover:not-in-data-[trigger=ComboBox]:not-in-data-[trigger=Select]:not-in-data-command:bg-highlight
      hover:not-in-data-[trigger=ComboBox]:not-in-data-[trigger=Select]:not-in-data-command:text-fg-on-highlight
      focus-visible:bg-highlight focus-visible:text-fg-on-highlight
      disabled:pointer-events-none disabled:text-(--disabled-fg,currentColor)
      disabled:**:text-current
      focus:in-[:is([data-trigger=ComboBox],[data-trigger=Select],[data-command])]:bg-highlight
      focus:in-[:is([data-trigger=ComboBox],[data-trigger=Select],[data-command])]:text-fg-on-highlight
      has-data-listbox-item-description:flex-col
      has-data-listbox-item-description:items-start
      has-data-listbox-item-description:gap-0
      has-data-listbox-item-description:has-[>svg]:pl-8
      has-data-listbox-item-description:**:data-listbox-item-indicator:top-2
      data-selection-mode:pr-8
      *:[kbd]:ml-auto *:[kbd]:border-0 *:[kbd]:bg-transparent
      *:[kbd]:text-fg-muted
      **:[svg]:pointer-events-none **:[svg]:shrink-0
      has-data-listbox-item-description:*:[svg]:absolute
      has-data-listbox-item-description:*:[svg]:top-2
      has-data-listbox-item-description:*:[svg]:left-2
      **:[svg]:not-with-[size]:size-4
    `,
    indicator:
      'pointer-events-none absolute right-2 flex items-center justify-center',
    itemLabel: '',
    itemDescription: 'text-fg-muted',
    loadMore: 'flex w-full items-center justify-center py-1 text-fg-muted',
    section: 'scroll-my-1',
    sectionTitle: 'px-1.5 py-1 text-xs text-fg-muted',
  },
  variants: {
    variant: {
      default: {},
      danger: {},
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const {
  root,
  loadMore,
  item,
  indicator,
  itemLabel,
  itemDescription,
  section,
  sectionTitle,
} = listBoxVariants()

interface ListBoxProps<T> extends ListBoxPrimitive.ListBoxProps<T> {
  isLoading?: ListBoxPrimitive.ListBoxLoadMoreItemProps['isLoading']
  onLoadMore?: ListBoxPrimitive.ListBoxLoadMoreItemProps['onLoadMore']
  shouldFocusOnHover?: boolean
}
const ListBox = <T extends object>({
  className,
  isLoading,
  onLoadMore,
  items,
  children,
  ...props
}: ListBoxProps<T>) => {
  const standalone = !use(ListBoxPrimitive.ListBoxContext)

  return (
    <ListBoxPrimitive.ListBox
      data-listbox=""
      className={composeRenderProps(className, cn => root({ className: cn }))}
      data-standalone={standalone || undefined}
      {...props}
    >
      <ListBoxPrimitive.Collection items={items}>
        {children}
      </ListBoxPrimitive.Collection>
      {onLoadMore && (
        <ListBoxPrimitive.ListBoxLoadMoreItem
          className={loadMore()}
          isLoading={isLoading}
          onLoadMore={onLoadMore}
        >
          <Loader />
        </ListBoxPrimitive.ListBoxLoadMoreItem>
      )}
    </ListBoxPrimitive.ListBox>
  )
}

/* -------------------------------------------------------------------------- */

interface ListBoxItemProps<T>
  extends
  ListBoxPrimitive.ListBoxItemProps<T>,
  VariantProps<typeof listBoxVariants> {}
const ListBoxItem = <T extends object>({
  className,
  variant,
  textValue: textValueProp,
  ...props
}: ListBoxItemProps<T>) => {
  const textValue
    = textValueProp
      || (typeof props.children === 'string' ? props.children : undefined)

  return (
    <ListBoxPrimitive.ListBoxItem
      data-listbox-item=""
      textValue={textValue}
      className={composeRenderProps(className, cn =>
        item({ className: cn, variant })
      )}
      {...props}
    >
      {composeRenderProps(
        props.children,
        (children, { selectionMode, isSelected }) => (
          <>
            {typeof children === 'string'
              ? (
                  <ListBoxItemLabel>{children}</ListBoxItemLabel>
                )
              : (
                  children
                )}
            {selectionMode !== 'none' && (
              <span data-listbox-item-indicator="" className={indicator()}>
                {isSelected && <CheckIcon />}
              </span>
            )}
          </>
        )
      )}
    </ListBoxPrimitive.ListBoxItem>
  )
}

/* -------------------------------------------------------------------------- */

interface ListBoxItemLabelProps extends React.ComponentProps<
  typeof TextPrimitive.Text
> {}
const ListBoxItemLabel = ({ className, ...props }: ListBoxItemLabelProps) => {
  return (
    <ListBoxPrimitive.Text
      data-listbox-item-label=""
      className={itemLabel({ className })}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------- */

interface ListBoxItemDescriptionProps extends React.ComponentProps<
  typeof TextPrimitive.Text
> {}
const ListBoxItemDescription = ({
  className,
  ...props
}: ListBoxItemDescriptionProps) => {
  return (
    <ListBoxPrimitive.Text
      data-listbox-item-description=""
      className={itemDescription({ className })}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------- */

interface ListBoxSectionProps<
  T
> extends ListBoxPrimitive.ListBoxSectionProps<T> {}
const ListBoxSection = <T extends object>({
  className,
  ...props
}: ListBoxSectionProps<T>) => {
  return (
    <ListBoxPrimitive.ListBoxSection
      data-listbox-section=""
      className={section({ className })}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------- */

interface ListBoxSectionHeaderProps extends React.ComponentProps<
  typeof ListBoxPrimitive.Header
> {}
const ListBoxSectionHeader = ({
  className,
  ...props
}: ListBoxSectionHeaderProps) => {
  return (
    <ListBoxPrimitive.Header
      data-listbox-section-header=""
      className={sectionTitle({ className })}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------- */

interface ListBoxVirtualizerProps<T> extends Omit<
  VirtualizerPrimitive.VirtualizerProps<T>,
  'layout'
> {}
const ListBoxVirtualizer = <T extends object>({
  ...props
}: ListBoxVirtualizerProps<T>) => {
  return (
    <VirtualizerPrimitive.Virtualizer
      layout={VirtualizerPrimitive.ListLayout}
      layoutOptions={{
        rowHeight: 32,
        padding: 4,
        gap: 0,
      }}
      {...props}
    />
  )
}

export type {
  ListBoxItemDescriptionProps,
  ListBoxItemLabelProps,
  ListBoxItemProps,
  ListBoxProps,
  ListBoxSectionHeaderProps,
  ListBoxSectionProps,
  ListBoxVirtualizerProps
}
export {
  ListBox,
  ListBoxItem,
  ListBoxItemDescription,
  ListBoxItemLabel,
  ListBoxSection,
  ListBoxSectionHeader,
  ListBoxVirtualizer
}
