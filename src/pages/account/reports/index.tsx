import { ChangeEvent, useState } from "react";
import { Container, Grid, Title } from "@mantine/core";

import Head from "next/head";
import Loading from "~/components/Atom/Loading";
import LoadingError from "~/components/Atom/LoadingError";
import ReportCard from "~/components/Report/Card";
import SearchInput from "~/components/Atom/SearchInput";
import SortingPanel from "~/components/Atom/SortingPanel";
import type { SortingPanelProps } from "~/types";
import { api } from "~/utils/api";
import { useSession } from "next-auth/react";

export default function OwnReports() {
  const pageTitle = "My Reports";
  const { data: session } = useSession();
  const [desc, setDesc] = useState(true);
  const [sortBy, setSortBy] = useState("updatedAt");
  const [searchString, setSearchString] = useState("");

  // FETCH OWN REPORTS (may run in kind of hydration error, if executed after session check... so let's run it into an invisible unauthorized error in background. this only happens, if session is closed in another tab...)
  const {
    data: reports,
    isLoading,
    isError,
  } = api.reports.getOwnReports.useQuery({
    search: searchString,
    orderBy: sortBy, // Set the desired orderBy field
    desc: desc, // Set the desired order (true for descending, false for ascending)
  });

  /* // Props for Sorting Panel */
  const sortingPanelProps: SortingPanelProps = {
    sortBy,
    setSortBy,
    desc,
    handleToggleDesc: () => setDesc((prev) => !prev),
  };

  // Fake Data for Fake Card
  const cardProps = {
    image:
      "https://images.unsplash.com/photo-1503262028195-93c528f03218?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1171&q=80",
    country: "Zkittlez",
    badges: [
      {
        emoji: "💡",
        label: "LED",
      },
      {
        emoji: "🥥",
        label: "Coco",
      },
      {
        emoji: "💎",
        label: "mineral",
      },
    ],
  };
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchString(event.target.value);
  };

  if (!session)
    return (
      <Container className="text-center text-4xl">Access Denied</Container>
    );

  if (isError) return <LoadingError />;

  return (
    <>
      <Head>
        <title>{`GrowAGram | ${pageTitle}`}</title>
        <meta name="description" content="My grow reports on growagram.com" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Loading isLoading={isLoading} />

      {/* // Main Content Container */}
      <Container size="xl" className="flex w-full flex-col space-y-2">
        {/* // Header with Title and Sorting */}
        <div className="flex items-center justify-between">
          {/* // Title */}
          <Title order={1} className="inline">
            {pageTitle}
          </Title>
          <SearchInput value={searchString} onChange={handleSearchChange} />

          <SortingPanel {...sortingPanelProps} />
        </div>
        {/* // Header End */}

        {/* // Report Grid */}
        <Grid gutter="sm">
          {/* LOOP OVER REPORTS */}
          {reports && reports.length
            ? reports.map((report) => {
                return (
                  <Grid.Col key={report.id} xs={12} sm={6} md={4} lg={3} xl={3}>
                    <ReportCard
                      {...cardProps}
                      procedure="own"
                      report={report}
                    />
                  </Grid.Col>
                );
              })
            : // rendering "not found" only if isLoading is false
              !isLoading && (
                <div className="hero bg-primary text-primary-content max-h-screen rounded-md">
                  <div className="hero-content flex-col md:flex-row">
                    {/* <Image alt="no report image" width={640} height={429} src="/A-rAZGIE2pA-unsplash.jpg" className="max-w-sm rounded-lg shadow-2xl" /> */}
                    <div className="text-center">
                      <h1 className="whitespace-nowrap text-3xl font-bold">
                        No Reports found! 😢
                      </h1>
                      <p className="error py-6 text-lg font-bold">
                        You haven&apos;t created any reports yet.
                      </p>
                    </div>
                  </div>
                </div>
              )}
        </Grid>
        {/* </Skeleton> */}
      </Container>
    </>
  );
}
