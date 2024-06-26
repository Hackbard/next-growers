import { Box, Container, Title } from "@mantine/core";

import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  NextPage,
} from "next";
import { getServerSession } from "next-auth";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { useRouter } from "next/router";

import AccessDenied from "~/components/Atom/AccessDenied";
import { AddReportForm } from "~/components/Report/AddForm";

import { authOptions } from "~/server/auth";

/** PROTECTED DYNAMIC PAGE with translations
 * getServerSideProps (Server-Side Rendering)
 *
 * @param GetServerSidePropsContext<{ locale: string; translations: string | string[] | undefined; }> context - The context object containing information about the request
 * @returns Promise<{ props: { [key: string]: any }; }> - A promise resolving to an object containing props to be passed to the page component
 */
export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => ({
  props: {
    ...(await serverSideTranslations(context.locale as string, [
      "common",
    ])),
    session: await getServerSession(
      context.req,
      context.res,
      authOptions
    ),
  },
});

const ProtectedCreateReport: NextPage = () => {
  const router = useRouter();
  const { locale: activeLocale } = router;
  const { t } = useTranslation(activeLocale);
  const pageTitle = t("common:report-create-headline");

  const { data: session } = useSession();

  if (!session?.user) return <AccessDenied />;

  return (
    <>
      <Head>
        <title>{`GrowAGram | ${pageTitle}`}</title>
        <meta
          name="description"
          content="Create your grow report on growagram.com"
        />
      </Head>

      {/* // Main Content Container */}
      <Container size="xl" className="flex w-full flex-col space-y-1">
        {/* // Header with Title */}
        <Box className="flex items-center justify-between pt-2">
          {/* // Title */}
          <Title order={1} className="inline">
            {pageTitle}
          </Title>
        </Box>
        {/* // Header End */}

        {/* // Add Component */}

        <AddReportForm user={session.user} />
      </Container>
    </>
  );
};

export default ProtectedCreateReport;
