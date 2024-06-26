import {
  Alert,
  Box,
  Center,
  Container,
  Loader,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import { httpStatusErrorMsg, noPostAtThisDay } from "~/messages";

import { useState } from "react";

import type { GetServerSideProps, NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { useRouter } from "next/router";

import { generateOpenGraphMetaTagsImage } from "~/components/OpenGraph/Image";
import { PostCard } from "~/components/Post/PostCard";
import PostDatepicker from "~/components/Post/PostDatepicker";
import { GrowBasicData } from "~/components/Report/GrowBasicData";
import { ReportHeader } from "~/components/Report/Header";

import { api } from "~/utils/api";
import { compareDatesWithoutTime } from "~/utils/helperUtils";

/** PUBLIC DYNAMIC PAGE with translations
 * getServerSideProps (Server-Side Rendering)
 *
 * @param GetServerSidePropsContext<ParsedUrlQuery, Record<string, string | string[]>> context - The context object containing information about the request
 * @returns Promise<GetServerSidePropsResult<Props>> - A promise resolving to an object containing props to be passed to the page component
 */
export const getServerSideProps: GetServerSideProps = async (
  context
) => {
  // Fetch translations using next-i18next
  const translations = await serverSideTranslations(
    context.locale as string,
    ["common"]
  );

  return {
    props: {
      ...translations,
    },
  };
};

/**
 * @Page ReportDetails
 * @param props: { trpcState: DehydratedState, reportId: string }
 * @returns NextPage
 */
const PublicReport: NextPage = () => {
  const router = useRouter();
  const growId = router.query.reportId as string;

  const [updateId, setUpdateId] = useState<string>("");
  const [selectedDate, selectDate] = useState<Date | null>(null);

  const theme = useMantineTheme();

  const xs = useMediaQuery(`(max-width: ${theme.breakpoints.xs})`);
  const sm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const md = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);
  const lg = useMediaQuery(`(max-width: ${theme.breakpoints.lg})`);
  const xl = useMediaQuery(`(max-width: ${theme.breakpoints.xl})`);
  const getResponsiveColumnCount = xs
    ? 1
    : sm
      ? 1
      : md
        ? 2
        : lg
          ? 3
          : xl
            ? 4
            : 5;

  // const { scrollIntoView, targetRef } =
  //   useScrollIntoView<HTMLDivElement>({
  //     offset: 1,
  //   });

  const {
    data: grow,
    isLoading: reportIsLoading,
    isError: reportHasErrors,
    error: error,
  } = api.reports.getIsoReportWithPostsFromDb.useQuery(growId, {
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  if (reportIsLoading)
    return (
      <Center>
        <Loader size="xl" m="xl" color="growgreen.4" />
      </Center>
    );
  if (reportHasErrors) {
    notifications.show(
      httpStatusErrorMsg(error.message, error.data?.httpStatus, true)
    );
    return (
      <>
        Error {error.data?.httpStatus}: {error.message}
      </>
    );
  }

  const dateOfnewestPost = grow.posts.reduce((maxDate, post) => {
    const postDate = new Date(post.date);
    return postDate > maxDate ? postDate : maxDate;
  }, new Date(0));

  const postDays = grow.posts.map((post) =>
    new Date(post.date).getTime()
  );

  const pageTitle = `${grow.title}`;

  const dateOfGermination = new Date(grow.createdAt);

  const defaultRelDate =
    dayjs(selectedDate)
      .subtract(getResponsiveColumnCount - 1, "month")
      .toDate() || dateOfGermination;

  const columnStartMonth: Date =
    defaultRelDate < dateOfGermination
      ? dateOfGermination
      : defaultRelDate;

  const handleSelectDate = (selectedDate: Date | null) => {
    if (!selectedDate) {
      return;
    }

    const matchingPost = grow.posts.find((post) => {
      const postDate = new Date(post.date);
      return compareDatesWithoutTime(selectedDate, postDate);
    });

    if (matchingPost) {
      // scrollIntoView({
      //   // alignment: "start",
      // });

      selectDate(new Date(matchingPost.date));
      setUpdateId(matchingPost.id);
      const newUrl = `/grow/${grow.id}/update/${matchingPost.id}`;
      void router.push({ pathname: newUrl }, undefined, {
        scroll: false,
      });
    } else {
      notifications.show(noPostAtThisDay);
    }
  };

  const imageTags = generateOpenGraphMetaTagsImage(
    grow.image?.cloudUrl as string
  );
  const description = "Create your grow report on growagram.com"; //@TODO fix me SEO
  const title = `Grow "${pageTitle}" from ${
    grow.author?.name as string
  } | GrowAGram`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta
          property="og:url"
          content={`https://growagram.com/grow/${grow.id}`}
        />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {imageTags &&
          imageTags.map((tag, index) => <meta key={index} {...tag} />)}
      </Head>

      {/* // Main Content Container */}
      <Container size="xl" className="flex flex-col space-y-2">
        {/* // Header with Title */}
        {/* <Box pt={theme.spacing.sm} className={classes.title}>
          <Title order={1} className="inline">
            {`${pageTitle}`}
          </Title>

        </Box> */}
        {/* // Header End */}
        <Container
          size="xl"
          px={0}
          mx="auto"
          pt="xs"
          className="flex w-full flex-col space-y-4"
        >
          {!reportIsLoading && !reportHasErrors && (
            <ReportHeader grow={grow} />
          )}
          {/* // Posts Date Picker */}
          {/* <Box ref={targetRef}> */}
          <Box>
            <PostDatepicker
              defaultDate={
                selectedDate ? columnStartMonth : dateOfGermination
              }
              postDays={postDays}
              selectedDate={selectedDate}
              handleSelectDate={handleSelectDate}
              dateOfnewestPost={dateOfnewestPost}
              dateOfGermination={dateOfGermination}
              responsiveColumnCount={getResponsiveColumnCount}
            />
          </Box>

          {postDays?.length === 0 ? (
            <>
              <Alert
                p={16}
                bg={theme.colors.groworange[5]}
                variant="filled"
              >
                <Text mx="auto">
                  Dieser Grow hat bisher leider noch keine Updates! 😪
                </Text>
              </Alert>
            </>
          ) : (
            <>
              {selectedDate === null ? (
                <Alert
                  p={16}
                  bg={theme.colors.green[9]}
                  variant="filled"
                >
                  <Text mx="auto">
                    Select an Update (Grow Day) from calendar!☝️
                  </Text>
                </Alert>
              ) : (
                <PostCard updateId={updateId} grow={grow} />
              )}
            </>
          )}
        </Container>
      </Container>

      {/* // GrowBasicData / Strains / Statistics */}
      <GrowBasicData grow={grow} dateOfnewestPost={dateOfnewestPost} />
    </>
  );
};

export default PublicReport;
