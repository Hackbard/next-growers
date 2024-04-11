import { appTitle } from "./_document";

import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  NextPage,
} from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";

import LandingPage from "~/components/LandingPage";

/** PUBLIC DYNAMIC PAGE with translations
 * getServerSideProps (Server-Side Rendering)
 *
 * @param GetServerSidePropsContext<Params extends ParsedUrlQuery = ParsedUrlQuery, Preview extends PreviewData = PreviewData> context - The context object containing information about the request
 * @returns Promise<GetServerSidePropsResult<Props>> - A promise resolving to an object containing props to be passed to the page component
 */
export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => ({
  props: {
    ...(await serverSideTranslations(context.locale as string, [
      "common",
    ])),
  },
});

/**
 * @Page PublicIndex
 * @param props: { trpcState: DehydratedState, reportId: string }
 * @returns NextPage
 */
const PublicIndex: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`Welcome | ${appTitle}`}</title>
        <meta
          name="description"
          content="GrowAGram is a cannabis home cultivation community for sharing and discovering tips, techniques, and insights for successful cannabis cultivation. Welcome! Join our image community, share your weed images and upload your own reports to share your successes and learn from others. We are in alpha version - your feedback is very appreciated!"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <LandingPage />
    </>
  );
};
export default PublicIndex;
