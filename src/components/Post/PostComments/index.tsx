import {
  ActionIcon,
  Box,
  Button,
  createStyles,
  Flex,
  Group,
  LoadingOverlay,
  Paper,
  rem,
  Space,
  Text,
  Title,
  Transition,
  useMantineTheme,
} from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { RichTextEditor } from "@mantine/tiptap";
import { IconTextWrap, IconX } from "@tabler/icons-react";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import SubScript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import type { Editor } from "@tiptap/react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  commentSuccessfulMsg,
  defaultErrorMsg,
  httpStatusErrorMsg,
} from "~/messages";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

import EmojiPicker from "~/components/Atom/EmojiPicker";
import UserAvatar from "~/components/Atom/UserAvatar";
import { UserComment } from "~/components/User/Comment";

import { Locale } from "~/types";

import { api } from "~/utils/api";
import { sanatizeDateString } from "~/utils/helperUtils";
import { InputEditCommentForm } from "~/utils/inputValidation";

interface CommentsProps {
  reportId: string;
  postId: string;
}

const PostComments = ({ reportId, postId }: CommentsProps) => {
  const router = useRouter();
  const { locale: activeLocale } = router;
  const { t } = useTranslation(activeLocale);

  const trpc = api.useUtils();

  const theme = useMantineTheme();

  const [isSaving, setIsSaving] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  const now = new Date();

  const { data: comments, isLoading } =
    api.comments.getCommentsByPostId.useQuery({
      postId: postId,
    });

  const { data: session, status } = useSession();

  const commentsRef = useRef<HTMLElement[]>([]);

  const newCommentForm = useForm({
    validate: zodResolver(InputEditCommentForm),
    validateInputOnChange: false,
    initialValues: {
      id: undefined,
      isResponseTo: "",
      postId: postId,
      content: "",
    },
  });

  const handleErrors = (errors: typeof newCommentForm.errors) => {
    Object.keys(errors).forEach((key) => {
      notifications.show(
        httpStatusErrorMsg(errors[key] as string, 422)
      );
    });
  };

  useEffect(() => {
    newCommentForm.setFieldValue("postId", postId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  // Prepare TipTap Editor for comment content
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        linkOnPaste: true,
        HTMLAttributes: {
          // Change rel to different value
          // Allow search engines to follow links(remove nofollow)
          // rel: 'noopener noreferrer',
          // Remove target entirely so links open in current tab
          target: null,
        },
      }),
      Superscript,
      SubScript,
      Highlight,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "justify"],
      }),
    ],
    content: newCommentForm.values.content,
    onUpdate: ({ editor }) => {
      newCommentForm.setFieldValue("content", editor.getHTML());
    },
  });

  // const [responsesLoaded, setResponsesLoaded] = useState(false);

  useEffect(() => {
    // Check if the URL contains a hash
    const hash = window.location.hash;

    console.debug("hash", hash);

    // Remove the '#' symbol from the hash
    const commentId = hash.slice(1);

    // Timeout before finding the corresponding comment's HTML element

    // setTimeout(() => {
    // Find the corresponding comment's HTML element using its ID
    const commentElement = commentsRef.current.find(
      (ref) => ref.id === commentId
    );

    console.debug("commentElement", commentElement);
    // Scroll to the comment if it exists
    if (commentElement) {
      commentElement.scrollIntoView({ behavior: "smooth" });
    }
    // }, 0); // Adjust the timeout as needed
  }, [
    comments,
    // responsesLoaded
  ]); // Add comments as a dependency

  const userComments = comments?.map((comment) => {
    return (
      <Box
        mt="lg"
        key={comment.id}
        id={comment.id}
        ref={(ref) => {
          if (ref) {
            commentsRef.current.push(ref);
          }
        }}
      >
        <UserComment
          // setResponsesLoaded={setResponsesLoaded}
          editor={editor}
          reportId={reportId}
          isResponse=""
          comment={comment}
          setNewOpen={setNewOpen}
          newCommentForm={newCommentForm}
        />
      </Box>
    );
  });

  const { mutate: tRPCsaveComment } =
    api.comments.saveComment.useMutation({
      onMutate: () => {
        setIsSaving(true);
      },
      // If the mutation fails, use the context
      // returned from onMutate to roll back
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onError: (error, _comment) => {
        notifications.show(defaultErrorMsg(error.message));
      },
      onSuccess: async (newCommentDB) => {
        notifications.show(commentSuccessfulMsg);
        newCommentForm.reset();
        editor?.commands.setContent("");
        await trpc.comments.getCommentsByPostId.fetch({
          postId: newCommentDB.postId as string,
        });
      },
      // Always refetch after error or success:
      onSettled: () => {
        setNewOpen(false);
        setIsSaving(false);
      },
    });

  return (
    <Box>
      {status !== "loading" && isLoading && <p>loading comments...</p>}
      {status === "authenticated" && (
        <>
          <Group m={4} position="apart">
            <Title order={2}>{t("common:comments-headline")}</Title>

            <Button
              sx={(theme) => ({
                [theme.fn.smallerThan("sm")]: {
                  padding: rem(5),
                  height: rem(26),
                  // width: rem(140),
                  fontSize: 16,
                  fontWeight: "normal",
                },
              })}
              fz="md"
              variant="filled"
              color={!newOpen ? "growgreen" : "dark"}
              leftIcon={
                <IconTextWrap
                  size={theme.fn.smallerThan("sm") ? 16 : 22}
                />
              }
              title={!newOpen ? "add new comment" : "close form"}
              onClick={() => {
                setNewOpen((prev) => !prev);
              }}
            >
              {t("common:comments-button-open-comments")}
            </Button>
          </Group>

          <Transition
            mounted={newOpen}
            transition="scale-y"
            duration={500}
            timingFunction="ease"
          >
            {(transitionStyles) => (
              <Paper
                style={{ ...transitionStyles }}
                p="sm"
                mt="sm"
                withBorder
              >
                <Group position="apart">
                  <Group position="left">
                    <UserAvatar
                      imageUrl={
                        session?.user.image
                          ? session.user.image
                          : `https://ui-avatars.com/api/?name=${
                              session.user.name as string
                            }`
                      }
                      userName={session?.user.name as string}
                      avatarRadius={42}
                      tailwindMarginTop={false}
                    />
                    <Box>
                      <Text fz="sm">
                        {session?.user.name as string}
                      </Text>
                      <Text fz="xs" c="dimmed">
                        {sanatizeDateString(
                          now.toISOString(),
                          router.locale === Locale.DE
                            ? Locale.DE
                            : Locale.EN,
                          false,
                          true
                        )}
                      </Text>
                    </Box>
                  </Group>
                  <Group position="right">
                    <>
                      <ActionIcon
                        color="orange"
                        variant="default"
                        title="reset form and close"
                        onClick={() => {
                          setNewOpen(false);
                          newCommentForm.reset();
                        }}
                        m={0}
                        p={0}
                        className=" cursor-default"
                      >
                        <IconX size="1.2rem" stroke={1.4} />
                      </ActionIcon>
                    </>

                    {/* <LikeHeart itemToLike={comment} itemType={"Comment"} /> */}
                  </Group>
                </Group>
                <Box>
                  {/* <Alert
                    p="xs"
                    mt="sm"
                    ml={42}
                    // w={420}
                    icon={<IconInfoCircle size="1rem" />}
                    title="Markdown support"
                    color="orange"
                    variant="outline"
                  >
                    Use{" "}
                    <Link
                      title="Markdown Cheat Sheet"
                      href={
                        "https://www.markdownguide.org/cheat-sheet/"
                      }
                      target="_blank"
                    >
                      <u>markdown</u>
                    </Link>{" "}
                    to <i>style</i> your <b>comment</b>!
                  </Alert> */}
                </Box>
                <form
                  onSubmit={newCommentForm.onSubmit((values) => {
                    tRPCsaveComment(values);
                  }, handleErrors)}
                >
                  <Box ml={42} mt={12} className="relative">
                    <LoadingOverlay
                      radius="sm"
                      visible={isSaving}
                      transitionDuration={300}
                      loaderProps={{
                        size: "md",
                        color: "growgreen.3",
                      }}
                    />
                    <RichTextEditor editor={editor}>
                      <RichTextEditor.Toolbar p="xs">
                        <RichTextEditor.ControlsGroup>
                          <EmojiPicker editor={editor as Editor} />
                        </RichTextEditor.ControlsGroup>

                        <RichTextEditor.ControlsGroup>
                          <RichTextEditor.Bold />
                          <RichTextEditor.Italic />
                          <RichTextEditor.Underline />
                          <RichTextEditor.Strikethrough />
                          <RichTextEditor.ClearFormatting />
                          <RichTextEditor.Highlight />
                          <RichTextEditor.Code />
                        </RichTextEditor.ControlsGroup>

                        <RichTextEditor.ControlsGroup>
                          <RichTextEditor.AlignLeft />
                          <RichTextEditor.AlignCenter />
                        </RichTextEditor.ControlsGroup>

                        <RichTextEditor.ControlsGroup>
                          <RichTextEditor.H1 />
                          <RichTextEditor.H2 />
                          <RichTextEditor.H3 />
                          <RichTextEditor.H4 />
                        </RichTextEditor.ControlsGroup>

                        <RichTextEditor.ControlsGroup>
                          <RichTextEditor.Link />
                          <RichTextEditor.Unlink />
                        </RichTextEditor.ControlsGroup>

                        <RichTextEditor.ControlsGroup>
                          <RichTextEditor.Blockquote />
                          <RichTextEditor.Hr />
                          <RichTextEditor.BulletList />
                          <RichTextEditor.OrderedList />
                          {/* <RichTextEditor.Subscript />
                          <RichTextEditor.Superscript /> */}
                        </RichTextEditor.ControlsGroup>
                      </RichTextEditor.Toolbar>
                      <RichTextEditor.Content
                        sx={(theme) => ({
                          boxShadow: `0 0 0px 1px ${theme.colors.growgreen[4]}`,
                        })}
                      />
                    </RichTextEditor>
                  </Box>
                  <Flex mt="sm" justify="flex-end" align="center">
                    <Button
                      size="sm"
                      sx={(theme) => ({
                        [theme.fn.smallerThan("sm")]: {
                          padding: rem(5),
                          height: rem(26),
                          // width: rem(140),
                          fontSize: 14,
                          fontWeight: "normal",
                        },
                      })}
                      loading={isSaving}
                      type="submit"
                      variant="filled"
                      color="growgreen"
                    >
                      {t("common:comment-save-button")}
                    </Button>
                  </Flex>
                </form>
              </Paper>
            )}
          </Transition>
        </>
      )}

      {userComments}
    </Box>
  );
};

export default PostComments;
