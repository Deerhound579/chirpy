import ArrowLeft from '@geist-ui/react-icons/arrowLeft';
import {
  GetStaticProps,
  GetStaticPropsContext,
  GetStaticPaths,
  InferGetStaticPropsType,
  GetStaticPropsResult,
} from 'next';
import Head from 'next/head';
import * as React from 'react';
import superjson from 'superjson';
import tw from 'twin.macro';
import { OperationResult } from 'urql';
import { pipe, subscribe } from 'wonka';

import { CommentLinkedList } from '$/blocks/CommentLinkedList';
import { WidgetLayout } from '$/blocks/Layout';
import { PoweredBy } from '$/blocks/PoweredBy';
import { UserMenu } from '$/blocks/UserMenu';
import { IconButton } from '$/components/Button';
import { Heading } from '$/components/Heading';
import { Link } from '$/components/Link';
import { CommentContextProvider } from '$/contexts/CommentContext';
import {
  CommentDetailsDocument,
  CommentDetailsSubscription,
  useCommentDetailsSubscription,
} from '$/graphql/generated/comment';
import { ThemeOfPageDocument, ThemeOfPageQuery } from '$/graphql/generated/page';
import { useCreateAComment } from '$/hooks/useCreateAComment';
import { useToggleALikeAction } from '$/hooks/useToggleALikeAction';
import { useWidgetSideEffects } from '$/hooks/useWidgetSideEffects';
import { getAdminGqlClient } from '$/lib/admin-gql-client';
import { APP_NAME } from '$/lib/constants';
import { CommentsDocument, CommentsQuery } from '$/server/graphql/generated/comment';
import { CommonWidgetProps } from '$/types/page.type';
import { Theme } from '$/types/theme.type';
import { CommentDetailNode } from '$/types/widget';
import { ssrMode } from '$/utilities/env';

// TODO: Migrate this page to a dialog widget (for analytics)
export default function CommentDetailsWidget(
  props: InferGetStaticPropsType<typeof getStaticProps>,
): JSX.Element {
  const handleSubmitReply = useCreateAComment({ pageId: props.comment?.pageId || '' });

  const handleClickLikeAction = useToggleALikeAction();
  const [{ data }] = useCommentDetailsSubscription({
    variables: { id: props.commentId },
    pause: ssrMode,
  });

  useWidgetSideEffects();

  const comment = data?.commentByPk || props.comment;

  return (
    <WidgetLayout widgetTheme={props.theme}>
      <Head>
        <title>{APP_NAME} comment details</title>
      </Head>
      <CommentContextProvider projectId={props.projectId}>
        <div css={tw`flex flex-row justify-between items-center mb-4`}>
          <Link href={`/widget/comment/${encodeURIComponent(props.pageURL)}`} variant="plain">
            <IconButton css={tw`transform translate-x-1`}>
              <ArrowLeft size={20} />
            </IconButton>
          </Link>
          <Heading as="h4">
            <span tw="font-bold">{comment?.user.name}</span>
            <span>{`'s comment details`}</span>
          </Heading>
          <UserMenu variant="Widget" />
        </div>
        {comment?.id && (
          <CommentLinkedList
            key={comment!.id}
            comment={comment!}
            onClickLikeAction={handleClickLikeAction}
            onSubmitReply={handleSubmitReply}
          />
        )}
        <PoweredBy />
      </CommentContextProvider>
    </WidgetLayout>
  );
}
type PathParams = {
  commentId: string;
};

type StaticProps = PathParams &
  CommonWidgetProps & {
    comment: CommentDetailNode;
    pageURL: string;
  };

export const getStaticPaths: GetStaticPaths<PathParams> = async () => {
  const client = getAdminGqlClient();
  const { data } = await client.query<CommentsQuery>(CommentsDocument).toPromise();
  const paths =
    data?.comments.map(({ id }) => ({
      params: {
        commentId: id,
      },
    })) || [];
  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps<StaticProps, PathParams> = async ({
  params,
}: GetStaticPropsContext<PathParams>): Promise<GetStaticPropsResult<StaticProps>> => {
  if (!params?.commentId) {
    return { notFound: true };
  }
  const { commentId } = params;
  const client = getAdminGqlClient();

  try {
    const { data } = await new Promise<OperationResult<CommentDetailsSubscription>>(
      (resolve, reject) => {
        // @ts-ignore
        const { unsubscribe } = pipe<OperationResult<CommentDetailsSubscription>>(
          client.subscription(CommentDetailsDocument, { id: commentId }),
          subscribe((result) => {
            // console.log(result);
            resolve(result);
          }),
        );
      },
    );

    if (!data?.commentByPk) {
      return { notFound: true };
    }

    const themeResult = await client
      .query<ThemeOfPageQuery>(ThemeOfPageDocument, {
        pageId: data.commentByPk.pageId,
      })
      .toPromise();
    if (!themeResult.data?.pageByPk) {
      console.error(`Can't find page info`);
      return { notFound: true };
    }

    return {
      props: {
        projectId: themeResult.data.pageByPk.project.id,
        comment: data.commentByPk,
        commentId,
        pageURL: themeResult.data.pageByPk.url,
        theme: (themeResult.data.pageByPk.project.theme as Theme) || null,
        isWidget: true,
      },
      revalidate: 1,
    };
  } catch (error) {
    console.error(superjson.stringify(error));
    return { notFound: true };
  }
};
