import PencilIcon from '@geist-ui/react-icons/edit2';
import XIcon from '@geist-ui/react-icons/x';
import { Menu, Transition } from '@headlessui/react';
import { NextRouter, useRouter } from 'next/router';
import React, { Fragment, useState } from 'react';
import tw from 'twin.macro';

import { Button } from '$/components/Button';
import { Link } from '$/components/Link';

import { appliedFilters, navigateToQuery, formattedFilters, Query, FilterPair } from './query';
import {
  FILTER_GROUPS,
  formatFilterGroup,
  filterGroupForFilter,
  FilterGroupKey,
} from './stats/modals/filter';
import { Site } from './type';

function removeFilter(router: NextRouter, key: string, query: any) {
  const newOpts: any = {
    [key]: false,
  };
  if (key === 'goal') {
    newOpts.props = false;
  }
  if (key === 'country') {
    newOpts.country_name = false;
  }
  if (key === 'region') {
    newOpts.region_name = false;
  }
  if (key === 'city') {
    newOpts.city_name = false;
  }

  navigateToQuery(router, query, newOpts);
}

function clearAllFilters(router: NextRouter, query: Query) {
  // eslint-disable-next-line unicorn/prefer-object-from-entries
  const newOpts = Object.keys(query.filters).reduce((acc, red) => ({ ...acc, [red]: false }), {});
  navigateToQuery(router, query, newOpts);
}

function filterType(val: string) {
  if (typeof val === 'string' && val.startsWith('!')) {
    return ['is not', val.slice(1)];
  }

  return ['is', val];
}

function filterText(key: keyof typeof formattedFilters, rawValue: string, query: Query) {
  const [type, value] = filterType(rawValue);

  if (key === 'goal') {
    return (
      <>
        Completed goal <b>{value}</b>
      </>
    );
  }
  if (key === 'props') {
    const [metaKey, metaValue] = Object.entries(value)[0];
    const eventName = query.filters.goal ? query.filters.goal : 'event';
    return (
      <>
        {eventName}.{metaKey} is <strong>{metaValue}</strong>
      </>
    );
  }
  if (key === 'browser_version') {
    const browserName = query.filters.browser ? query.filters.browser : 'Browser';
    return (
      <>
        {browserName}.Version {type} <strong>{value}</strong>
      </>
    );
  }
  if (key === 'os_version') {
    const osName = query.filters.os ? query.filters.os : 'OS';
    return (
      <>
        {osName}.Version {type} <strong>{value}</strong>
      </>
    );
  }
  if (key === 'country') {
    const q = new URLSearchParams(window.location.search);
    const countryName = q.get('country_name');
    return (
      <>
        Country {type} <strong>{countryName}</strong>
      </>
    );
  }

  if (key === 'region') {
    const q = new URLSearchParams(window.location.search);
    const regionName = q.get('region_name');
    return (
      <>
        Region {type} <strong>{regionName}</strong>
      </>
    );
  }

  if (key === 'city') {
    const q = new URLSearchParams(window.location.search);
    const cityName = q.get('city_name');
    return (
      <>
        City {type} <strong>{cityName}</strong>
      </>
    );
  }

  const formattedFilter = formattedFilters[key];

  if (formattedFilter) {
    return (
      <>
        {formattedFilter} {type} <strong>{value}</strong>
      </>
    );
  }

  throw new Error(`Unknown filter: ${key}`);
}

function renderDropdownFilter(
  router: NextRouter,
  site: Site,
  [key, value]: FilterPair,
  query: Query,
) {
  if (key === 'props') {
    return (
      <Menu.Item key={key}>
        <div
          className="px-4 sm:py-2 py-3 text-sm leading-tight flex items-center justify-between"
          key={key + value}
        >
          <span className="inline-block w-full truncate">{filterText(key, value, query)}</span>
          <strong
            title={`Remove filter: ${formattedFilters[key]}`}
            className="ml-2 cursor-pointer hover:text-indigo-700 dark:hover:text-indigo-500"
            onClick={() => removeFilter(router, key, query)}
          >
            <XIcon className="w-4 h-4" />
          </strong>
        </div>
      </Menu.Item>
    );
  }

  return (
    <Menu.Item key={key}>
      <div
        className="px-3 md:px-4 sm:py-2 py-3 text-sm leading-tight flex items-center justify-between"
        key={key + value}
      >
        <Link
          disabled
          title={`Edit filter: ${formattedFilters[key]}`}
          href={`/${encodeURIComponent(site.domain)}/filter/${filterGroupForFilter(key)}${
            window.location.search
          }`}
          className="group flex w-full justify-between items-center"
          style={{ width: 'calc(100% - 1.5rem)' }}
          variant="plain"
        >
          <span className="inline-block w-full truncate">{filterText(key, value, query)}</span>
          <PencilIcon className="w-4 h-4 ml-1 cursor-pointer group-hover:text-indigo-700 dark:group-hover:text-indigo-500" />
        </Link>
        <strong
          title={`Remove filter: ${formattedFilters[key]}`}
          className="ml-2 cursor-pointer hover:text-indigo-700 dark:hover:text-indigo-500"
          onClick={() => removeFilter(router, key, query)}
        >
          <XIcon className="w-4 h-4" />
        </strong>
      </div>
    </Menu.Item>
  );
}

function filterDropdownOption(site: Site, option: FilterGroupKey) {
  return (
    <Menu.Item key={option}>
      {({ active }) => (
        <Link
          disabled
          href={`/${encodeURIComponent(site.domain)}/filter/${option}${window.location.search}`}
          css={[
            active ? tw`bg-gray-100 text-gray-1100` : tw`text-gray-1100`,
            tw`block px-4 py-2 text-sm font-medium`,
          ]}
        >
          {formatFilterGroup(option)}
        </Link>
      )}
    </Menu.Item>
  );
}

type DropdownContentProps = Pick<FiltersProps, 'query' | 'site'> & Pick<FiltersState, 'wrapped'>;

function DropdownContent({ site, query, wrapped }: DropdownContentProps): JSX.Element {
  const [addingFilter, setAddingFilter] = useState(false);
  const router = useRouter();

  if (wrapped === 0 || addingFilter) {
    return (
      <>
        {(Object.keys(FILTER_GROUPS) as FilterGroupKey[]).map((option: FilterGroupKey) =>
          filterDropdownOption(site, option),
        )}
      </>
    );
  }

  return (
    <>
      <Button
        variant="text"
        tw="border-b border-gray-200 dark:border-gray-500 px-4 sm:py-2 py-3 text-sm leading-tight hover:text-indigo-700 dark:hover:text-indigo-500"
        onClick={() => setAddingFilter(true)}
      >
        + Add filter
      </Button>
      {appliedFilters(query).map((filter) => renderDropdownFilter(router, site, filter, query))}
      <Menu.Item key="clear">
        <div
          className="border-t border-gray-200 dark:border-gray-500 px-4 sm:py-2 py-3 text-sm leading-tight hover:text-indigo-700 dark:hover:text-indigo-500 hover:cursor-pointer"
          onClick={() => clearAllFilters(router, query)}
        >
          Clear All Filters
        </div>
      </Menu.Item>
    </>
  );
}

export interface FiltersProps {
  className?: string;
  site: Site;
  query: Query;
  router: NextRouter;
}

interface FiltersState {
  viewport: number;
  // 0=unwrapped, 1=waiting to check, 2=wrapped
  wrapped: 0 | 1 | 2;
}

class Filters extends React.Component<FiltersProps, FiltersState> {
  constructor(props: FiltersProps) {
    super(props);

    this.state = {
      wrapped: 1,
      viewport: 1080,
    };

    this.renderDropDown = this.renderDropDown.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleKeyup = this.handleKeyup.bind(this);
  }

  componentDidMount() {
    // document.addEventListener('mousedown', this.handleClick, false);
    window.addEventListener('resize', this.handleResize, false);
    document.addEventListener('keyup', this.handleKeyup);

    this.handleResize();
    this.rewrapFilters();
  }

  componentDidUpdate(prevProps: FiltersProps, prevState: FiltersState) {
    const { query } = this.props;
    const { viewport, wrapped } = this.state;

    if (
      JSON.stringify(query) !== JSON.stringify(prevProps.query) ||
      viewport !== prevState.viewport
    ) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ wrapped: 1 });
    }

    if (wrapped === 1 && prevState.wrapped !== 1) {
      this.rewrapFilters();
    }
  }

  componentWillUnmount() {
    // document.removeEventListener('mousedown', this.handleClick, false);
    document.removeEventListener('keyup', this.handleKeyup);
    window.removeEventListener('resize', this.handleResize, false);
  }

  handleKeyup(e: KeyboardEvent) {
    const { query, router } = this.props;

    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (e.key === 'Escape') {
      clearAllFilters(router, query);
    }
  }

  handleResize() {
    this.setState({ viewport: window.innerWidth || 639 });
  }

  // Checks if the filter container is wrapping items
  rewrapFilters() {
    const items = document.querySelector<HTMLElement>('#filters');
    const { wrapped, viewport } = this.state;

    // Always wrap on mobile
    if (appliedFilters(this.props.query).length > 0 && viewport <= 768) {
      this.setState({ wrapped: 2 });
      return;
    }

    this.setState({ wrapped: 0 });

    // Don't rewrap if we're already properly wrapped, there are no DOM children, or there is only filter
    if (wrapped !== 1 || !items || appliedFilters(this.props.query).length === 1) {
      return;
    }

    let prevItem: DOMRect | null = null;

    // For every filter DOM Node, check if its y value is higher than the previous (this indicates a wrap)
    [...(items.childNodes as unknown as HTMLElement[])].forEach((item) => {
      const currItem = item.getBoundingClientRect();
      if (prevItem && prevItem?.top < currItem.top) {
        this.setState({ wrapped: 2 });
      }
      prevItem = currItem;
    });
  }

  renderListFilter([key, value]: FilterPair, query: Query) {
    return (
      <span
        key={key}
        title={value}
        className="flex bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 shadow text-sm rounded mr-2 items-center"
      >
        {key === 'props' ? (
          <span className="flex w-full h-full items-center py-2 pl-3">
            <span className="inline-block max-w-2xs md:max-w-xs truncate">
              {filterText(key, value, query)}
            </span>
          </span>
        ) : (
          <>
            <Link
              disabled
              title={`Edit filter: ${formattedFilters[key]}`}
              className="flex w-full h-full items-center py-2 pl-3 text-gray-1200"
              href={`/${encodeURIComponent(this.props.site.domain)}/filter/${filterGroupForFilter(
                key,
              )}${window.location.search}`}
              variant="plain"
            >
              <span className="inline-block max-w-2xs md:max-w-xs truncate">
                {filterText(key, value, query)}
              </span>
            </Link>
          </>
        )}
        <span
          title={`Remove filter: ${formattedFilters[key]}`}
          className="flex h-full w-full px-2 cursor-pointer hover:text-indigo-900 text-gray-800 items-center"
          onClick={() => removeFilter(this.props.router, key, query)}
        >
          <XIcon className="w-4 h-4" />
        </span>
      </span>
    );
  }

  // TODO: Add filter dropdown
  renderDropdownButton() {
    return null;
    // if (this.state.wrapped === 2) {
    //   const filterCount = appliedFilters(this.props.query).length;
    //   return (
    //     <>
    //       <AdjustmentsIcon className="-ml-1 mr-1 h-4 w-4" aria-hidden="true" />
    //       {filterCount} Filter{filterCount === 1 ? '' : 's'}
    //     </>
    //   );
    // }

    // return (
    //   <>
    //     <PlusIcon className="-ml-1 mr-1 h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
    //     {/* This would have been a good use-case for JSX! But in the interest of keeping the breakpoint width logic with TailwindCSS, this is a better long-term way to deal with it. */}
    //     <span className="sm:hidden">Filter</span>
    //     <span className="hidden sm:inline-block">Add filter</span>
    //   </>
    // );
  }

  renderDropDown() {
    const { query, site } = this.props;

    return (
      <Menu as="div" className="md:relative ml-auto">
        {({ open }) => (
          <>
            <div>
              <Menu.Button tw="flex items-center text-xs md:text-sm font-medium leading-tight px-3 py-2 cursor-pointer ml-auto text-gray-1100 hover:bg-gray-200 dark:hover:bg-gray-900 rounded">
                {this.renderDropdownButton()}
              </Menu.Button>
            </div>

            <Transition
              show={open}
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items
                static
                className="absolute w-full left-0 right-0 md:w-72 md:absolute md:top-auto md:left-auto md:right-0 mt-2 origin-top-right z-10"
              >
                <div
                  className="rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5
                  font-medium text-gray-800 dark:text-gray-200"
                >
                  <DropdownContent query={query} site={site} wrapped={this.state.wrapped} />
                </div>
              </Menu.Items>
            </Transition>
          </>
        )}
      </Menu>
    );
  }

  renderFilterList() {
    const { query } = this.props;

    if (this.state.wrapped !== 2) {
      return (
        <div id="filters" className="flex flex-wrap">
          {appliedFilters(query).map((filter) => this.renderListFilter(filter, query))}
        </div>
      );
    }

    return null;
  }

  render() {
    return (
      <>
        {this.renderFilterList()}
        {this.renderDropDown()}
      </>
    );
  }
}

export default Filters;
