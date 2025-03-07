import Loader from '@geist-ui/react-icons/loader';
import MoreVertical from '@geist-ui/react-icons/moreVertical';
import Trash2 from '@geist-ui/react-icons/trash2';
import * as React from 'react';
import tw from 'twin.macro';

import { BaseButton, Button } from '$/components/Button';
import { Card } from '$/components/Card';
import { Dialog } from '$/components/Dialog';
import { Divider } from '$/components/Divider';
import { Heading } from '$/components/Heading';
import { Link } from '$/components/Link';
import { List } from '$/components/List';
import { Menu } from '$/components/Menu';
import { Text } from '$/components/Text';
import { useToast } from '$/components/Toast';
import { useDeleteProjectByPkMutation } from '$/graphql/generated/project';
import { UserDashboardProjectsQuery } from '$/graphql/generated/user';
import { listHoverable } from '$/styles/common';
import { dayjs } from '$/utilities/date';

import { IntegrateGuide } from '../IntegrateGuide';
import { PageViewStats } from './page-view-stats';

export type ProjectCardProps = {
  project: NonNullable<UserDashboardProjectsQuery['userByPk']>['projects'][number];
  onDeletedProject: () => void;
};

export function ProjectCard({ project, onDeletedProject }: ProjectCardProps): JSX.Element {
  const [deletingProjectName, setDeletingProject] = React.useState('');
  const [deletingProjectId, setDeletingProjectId] = React.useState('');
  const handleClickDeleteProjectMenu = (id: string, name: string) => {
    setDeletingProjectId(id);
    setDeletingProject(name);
  };
  const handleCloseDialog = () => {
    setDeletingProjectId('');
    setDeletingProject('');
  };
  const [{ fetching: loading }, deleteProjectByPkMutation] = useDeleteProjectByPkMutation();
  const { showToast } = useToast();
  const handleClickConfirmDelete = async () => {
    try {
      await deleteProjectByPkMutation({
        id: deletingProjectId,
      });
      setDeletingProjectId('');
      setDeletingProject('');
      onDeletedProject();
    } catch (error) {
      console.error(error);
      showToast({
        type: 'error',
        title: 'Sorry, something went wrong in our side, please try again later.',
      });
    }
  };
  const [pageSize, setPageSize] = React.useState(5);
  const pages = project.pages.slice(0, pageSize);
  const showExpandBtn = project.pages.length > 5;
  const isExpanded = pages.length === project.pages.length;

  function handleClickExpand(): void {
    if (pageSize === project.pages.length) {
      return setPageSize(5);
    }
    const newSize = Math.min(pageSize + 5, project.pages.length);
    setPageSize(newSize);
  }

  return (
    <Card as="section" key={project.id} tw="pt-4 space-y-4">
      <div tw="flex justify-between flex-nowrap flex-row items-center space-x-2 pl-6 pr-3">
        <Heading as="h3">{project.name}</Heading>
        <div tw="flex flex-row items-center space-x-2">
          <PageViewStats domain={project.domain} />
          <Menu
            styles={{ root: tw`mr-1` }}
            buttonProps={{ ariaLabel: 'Show more project options' }}
            content={
              <span tw="p-1">
                <MoreVertical size={20} />
              </span>
            }
          >
            <Menu.Item
              onClick={() => handleClickDeleteProjectMenu(project.id, project.name)}
              tw="space-x-1"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </Menu.Item>
          </Menu>
        </div>
      </div>
      <Text tw="px-6" variant="secondary">
        {project.domain}
      </Text>
      <div tw="px-6 flex flex-row space-x-2">
        <Link href={`/theme/${project.domain}`} variant="plain" tabIndex={-1}>
          <Button color="primary" shadow={false} tw="px-2 py-1">
            Theme
          </Button>
        </Link>
        <IntegrateGuide domain={project.domain} />
      </div>
      {pages.length > 0 ? (
        <div>
          <List tw="px-4">
            {pages.map((page) => (
              <List.Item key={page.id} css={[listHoverable]}>
                <Link
                  href={page.url}
                  title={page.title || page.url}
                  variant="plain"
                  tw="inline-block max-w-xs overflow-ellipsis overflow-hidden whitespace-nowrap"
                >
                  {page.title || page.url}
                </Link>
              </List.Item>
            ))}
          </List>
          {showExpandBtn && (
            <BaseButton
              aria-expanded={isExpanded}
              onClick={handleClickExpand}
              tw="text-primary-900 hover:(bg-primary-900 text-white) rounded px-2 py-1 ml-4"
            >
              {!isExpanded ? 'Show more' : 'Show less'}
            </BaseButton>
          )}
        </div>
      ) : (
        <Text tw="px-6" variant="secondary">
          No page integrated
        </Text>
      )}
      <Divider />
      <div tw="px-6 pb-4">
        <Text tw="leading-none" size="sm" variant="secondary">
          Created {dayjs(project.createdAt).fromNow()}
        </Text>
      </div>
      <Dialog
        type="Alert"
        title={
          <>
            Delete the project <span tw="font-bold">{deletingProjectName}</span>
          </>
        }
        show={!!deletingProjectName}
        onClose={handleCloseDialog}
      >
        <Text>
          All of your project data will be deleted permanently. This action cannot be undone.
        </Text>
        <Dialog.Footer>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="solid" color="red" onClick={handleClickConfirmDelete} disabled={loading}>
            {loading ? <Loader /> : 'Delete'}
          </Button>
        </Dialog.Footer>
      </Dialog>
    </Card>
  );
}
