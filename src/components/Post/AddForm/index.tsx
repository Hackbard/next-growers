import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Group,
  Input,
  NumberInput,
  Paper,
  Select,
  TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm, zodResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { RichTextEditor } from "@mantine/tiptap";
import {
  IconBulb,
  IconCalendarEvent,
  IconNumber,
  IconPlant,
} from "@tabler/icons-react";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import SubScript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { InputCreatePostForm } from "~/helpers/inputValidation";

import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";

import ImageUploader from "~/components/ImageUploader";
import { onlyOnePostPerDayAllowed } from "~/components/Notifications/messages";

import type {
  IsoReportWithPostsFromDb,
  Post,
  PostDbInput,
} from "~/types";
import { GrowStage } from "~/types";

import { api } from "~/utils/api";

interface AddPostProps {
  isoReport: IsoReportWithPostsFromDb;
  post: Post | null;
}

const prefillHTMLContent =
  "<mark><i>[put your text here and delete further example text below]</i></mark></br><h1>RichTextEditor</h1>is designed to be as simple as possible to bring a familiar editing experience to regular users.";

const AddPost = (props: AddPostProps) => {
  const { isoReport: report, post } = props;
  const [imageIds, setImageIds] = useState<string[]>([]);

  const router = useRouter();
  const { locale: activeLocale } = router;
  const { t } = useTranslation(activeLocale);

  // Update "images" form field value, if "imageIds" state changes
  useEffect(() => {
    createPostForm.setFieldValue("images", imageIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageIds]);

  // Prepare WISIWIG Editior
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      Superscript,
      SubScript,
      Highlight,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "justify"],
      }),
    ],
    content: post ? post.content : prefillHTMLContent,
  });

  if (report == null) return null;

  const trpc = api.useUtils();

  const { mutate: tRPCaddPostToReport } =
    api.posts.createPost.useMutation({
      onMutate: (addPostToReport) => {
        console.log("START posts.createPost.useMutation");
        console.log("addPostToReport", addPostToReport);
      },
      // If the mutation fails,
      // use the context returned from onMutate to roll back
      onError: (err, newReport, context) => {
        notifications.show(onlyOnePostPerDayAllowed);
        if (!context) return;
      },
      onSuccess: async () => {
        toast.success("The update was saved to your report");
        setImageIds([]);
        createPostForm.setFieldValue("images", imageIds);
        console.log("imageIds: ", imageIds);
        await trpc.reports.getIsoReportWithPostsFromDb.refetch();
        // Navigate to the new report page
        // void router.push(`/account/grows/${newReportDB.id}`);
      },
      // Always refetch after error or success:
      onSettled: () => {
        setImageIds([]);
        createPostForm.setFieldValue("images", imageIds);
        console.log("END posts.createPost.useMutation");
      },
    });

  const reportStartDate = new Date(report.createdAt);
  reportStartDate.setHours(0, 0, 0, 0); // Set time to midnight for calculation
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // Set time to midnight for calculation
  currentDate.setDate(currentDate.getDate());
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set today's time to 00:00:00

  const growDay = post
    ? // Calculate Grow day from props calc(post.date - reportStartDate)
      Math.floor(
        (new Date(post.date).getTime() - reportStartDate.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : // Calculate the difference calc(now - reportStartDate)
      Math.floor(
        (currentDate.getTime() - reportStartDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const createPostForm = useForm({
    validate: zodResolver(InputCreatePostForm(reportStartDate)),
    initialValues: {
      id: post ? post.id : "",
      date: post ? new Date(post.date) : today,
      day: growDay, //FIXME: calculate GrowDay if prop post,
      title: post ? post.title : "",
      content: post ? post.content : prefillHTMLContent,
      growStage: post ? post.growStage : undefined,
      lightHoursPerDay: post ? (post.lightHoursPerDay as number) : 0,
      images: imageIds,
    },
  });

  function handleSubmit(values: {
    date: Date;
    day: number;
    title: string;
    content: string;
    growStage: keyof typeof GrowStage | undefined;
    lightHoursPerDay: number;
    images: string[];
  }) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { day, ...restValues } = values; // Omitting the 'day' field
    const editorHtml = editor?.getHTML() as string;
    restValues.content = editorHtml;

    const savePost: PostDbInput = {
      ...restValues,
      images: imageIds,
      growStage: restValues.growStage as keyof typeof GrowStage,
      reportId: report.id as string,
      authorId: report.authorId as string,
    };

    tRPCaddPostToReport(savePost);
  }
  const handleErrors = (errors: typeof createPostForm.errors) => {
    if (errors.id) {
      toast.error(errors.id as string);
    }
    if (errors.title) {
      toast.error(errors.title as string);
    }
    if (errors.images) {
      toast.error(errors.images as string);
    }
  };

  return (
    <Container p={0} size="md">
      <Paper p="sm" withBorder>
        <form
          onSubmit={createPostForm.onSubmit((values) => {
            handleSubmit(values);
          }, handleErrors)}
        >
          <Box className="space-y-2">
            <TextInput {...createPostForm.getInputProps("id")} hidden />
            {imageIds.map((imageId, index) => (
              <input
                key={index}
                type="hidden"
                name={`images[${index}]`}
                value={imageId}
              />
            ))}

            <Box>
              <Grid gutter="sm">
                <Grid.Col xs={12} sm={6} md={6} lg={6} xl={6}>
                  <Flex
                    className="justify-start space-x-2"
                    align="baseline"
                  >
                    <NumberInput
                      label={t("common:post-growday")}
                      description={t(
                        "common:addpost-growdaydescription"
                      )}
                      w={142}
                      placeholder="1"
                      icon={<IconNumber size="1.2rem" />}
                      withAsterisk
                      min={0}
                      {...createPostForm.getInputProps("day")}
                      onChange={(value: number) => {
                        const growDayOffSet = parseInt(
                          value.toString(),
                          10
                        );
                        if (!growDayOffSet && growDayOffSet != 0)
                          return; // prevent error if changed to empty string
                        const newPostDate = new Date(reportStartDate); // Create a new Date object using the reportStartDate
                        newPostDate.setUTCDate(
                          newPostDate.getUTCDate() + growDayOffSet
                        );
                        createPostForm.setFieldValue(
                          "date",
                          newPostDate
                        );
                        createPostForm.setFieldValue(
                          "day",
                          growDayOffSet
                        );
                      }}
                    />
                    <DateInput
                      label={t("common:post-updatedate")}
                      description={t(
                        "common:addpost-updatedatedescription"
                      )}
                      valueFormat="MMM DD, YYYY HH:mm"
                      // valueFormat="DD/MM/YYYY HH:mm:ss"
                      className="w-full"
                      icon={<IconCalendarEvent size="1.2rem" />}
                      withAsterisk
                      {...createPostForm.getInputProps("date")}
                      onChange={(selectedDate: Date) => {
                        const newDate = new Date(selectedDate);
                        /* 
  newDate.setHours(reportStartDate.getHours());
  newDate.setMinutes(reportStartDate.getMinutes());
  newDate.setSeconds(reportStartDate.getSeconds());
  newDate.setMilliseconds(reportStartDate.getMilliseconds()); 
  */

                        createPostForm.setFieldValue("date", newDate);

                        /* const timeDifferenceMs =
    selectedDate.getTime() - reportStartDate.getTime(); */

                        const timeDifferenceDays = Math.floor(
                          (selectedDate.getTime() -
                            reportStartDate.getTime()) /
                            (1000 * 60 * 60 * 24)
                        );

                        createPostForm.setFieldValue(
                          "day",
                          timeDifferenceDays
                        );
                      }}
                    />
                  </Flex>
                </Grid.Col>
                <Grid.Col xs={12} sm={6} md={6} lg={6} xl={6}>
                  <Flex
                    className="justify-start space-x-2"
                    align="baseline"
                  >
                    <NumberInput
                      label="Light Hours"
                      description="Hours per day (h/d)"
                      withAsterisk
                      w={142}
                      min={0}
                      max={24}
                      {...createPostForm.getInputProps(
                        "lightHoursPerDay"
                      )}
                      icon={<IconBulb size="1.2rem" />}
                    />
                    <Select
                      label="Grow stage"
                      description="Actual grow stage"
                      data={Object.keys(GrowStage).map((key) => ({
                        value: key,
                        label: GrowStage[key as keyof typeof GrowStage],
                      }))}
                      withAsterisk
                      {...createPostForm.getInputProps("growStage")}
                      className="w-full"
                      icon={<IconPlant size="1.2rem" />}
                    />
                  </Flex>
                </Grid.Col>
              </Grid>
            </Box>
            <TextInput
              withAsterisk
              label="Titel for this update"
              placeholder="Titel of this Update"
              {...createPostForm.getInputProps("title")}
            />
            <Input
              hidden
              {...createPostForm.getInputProps("content")}
            />
            <Box fz={"sm"}>
              Text<sup className="ml-1 text-red-600">*</sup>
            </Box>
            <RichTextEditor mt={-10} editor={editor}>
              <RichTextEditor.Toolbar sticky stickyOffset={60}>
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
                  <RichTextEditor.H1 />
                  <RichTextEditor.H2 />
                  <RichTextEditor.H3 />
                  <RichTextEditor.H4 />
                </RichTextEditor.ControlsGroup>

                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.Blockquote />
                  <RichTextEditor.Hr />
                  <RichTextEditor.BulletList />
                  <RichTextEditor.OrderedList />
                  <RichTextEditor.Subscript />
                  <RichTextEditor.Superscript />
                </RichTextEditor.ControlsGroup>

                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.Link />
                  <RichTextEditor.Unlink />
                </RichTextEditor.ControlsGroup>

                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.AlignLeft />
                  <RichTextEditor.AlignCenter />
                  {/* 
                <RichTextEditor.AlignJustify/>
                <RichTextEditor.AlignRight/> */}
                </RichTextEditor.ControlsGroup>
              </RichTextEditor.Toolbar>

              <RichTextEditor.Content />
            </RichTextEditor>
            <ImageUploader
              report={report}
              cloudUrls={post?.images.map((image) => image.cloudUrl)}
              setImageIds={setImageIds}
            />

            <Group position="right" mt="xl">
              <Button w={180} variant="outline" type="submit">
                {t("common:post-button-safeupdate")}
              </Button>
            </Group>
          </Box>
        </form>
      </Paper>
      {/* <ReportDebugFooter report={report} /> */}
    </Container>
  );
};

export default AddPost;
