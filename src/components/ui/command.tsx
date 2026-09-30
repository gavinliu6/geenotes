'use client'

import * as AutocompletePrimitive from 'react-aria-components/Autocomplete'
import { tv } from 'tailwind-variants'

import type { ListBoxProps } from '@/components/ui/list-box'
import {
  ListBox,
  ListBoxItem,
  ListBoxSection,
  ListBoxSectionHeader
} from '@/components/ui/list-box'
import { SearchField } from '@/components/ui/search-field'

const commandVariants = tv({
  base: `
    group/command flex max-h-[inherit] w-full flex-col gap-1 text-fg
    **:data-listbox:min-h-0 **:data-listbox:scroll-py-2
    **:data-listbox:overflow-y-auto **:data-listbox:px-2 **:data-listbox:pt-0
    **:data-listbox:pb-2
    **:data-listbox-item:py-1.5
    in-data-drawer:**:data-listbox-item:p-2
    in-data-modal:**:data-listbox-item:p-2
    **:data-listbox-section-header:py-1.5
    **:data-listbox-section-header:font-medium
    in-data-drawer:**:data-menu-item:p-2
    in-data-modal:**:data-menu-item:p-2
    **:data-search-field:shrink-0 **:data-search-field:px-2
    **:data-search-field:pt-2 **:data-search-field:pb-0
    **:data-listbox:**:data-separator:-mx-2
    **:data-listbox:**:data-separator:my-2
    **:[[data-search-field]>[data-input-group]]:rounded-[max(var(--radius-md),calc(var(--surface-radius,var(--radius-lg))-(--spacing(2))))]
  `,
})

/* -------------------------------------------------------------------------- */

interface CommandProps<T extends object>
  extends
  Omit<AutocompletePrimitive.AutocompleteProps<T>, 'children' | 'filter'>,
  Omit<React.ComponentProps<'div'>, 'slot'> {
  filter?: Intl.CollatorOptions
  shouldFilter?: boolean
}

function Command<T extends object>({
  className,
  slot,
  filter,
  shouldFilter = true,
  ...props
}: CommandProps<T>) {
  const { contains } = AutocompletePrimitive.useFilter({
    sensitivity: 'base',
    ignorePunctuation: true,
    ...filter,
  })

  return (
    <AutocompletePrimitive.Autocomplete
      filter={shouldFilter ? contains : undefined}
    >
      <div
        data-command=""
        className={commandVariants({ className })}
        {...props}
      />
    </AutocompletePrimitive.Autocomplete>
  )
}

/* -------------------------------------------------------------------------- */

function CommandContent<T extends object>(props: ListBoxProps<T>) {
  return <ListBox shouldFocusOnHover {...props} />
}

/* -------------------------------------------------------------------------- */

export type { CommandProps }
export {
  Command,
  CommandContent,
  SearchField as CommandInput,
  ListBoxItem as CommandItem,
  ListBoxSection as CommandSection,
  ListBoxSectionHeader as CommandSectionHeader }
