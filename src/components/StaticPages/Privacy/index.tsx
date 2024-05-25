import {
  Box,
  Container,
  createStyles,
  Image,
  rem,
  Title,
  useMantineColorScheme,
} from "@mantine/core";

import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";

const useStyles = createStyles((theme) => ({
  container: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "top",
    alignItems: "center",
    paddingTop: theme.spacing.lg,
  },

  title: {
    fontSize: rem(48),
    fontWeight: 900,
    lineHeight: 1.1,
    paddingTop: 12,
    paddingBottom: 12,

    [theme.fn.smallerThan("sm")]: {
      fontSize: rem(42),
      lineHeight: 1.2,
    },

    [theme.fn.smallerThan("xs")]: {
      fontSize: rem(36),
      lineHeight: 1.3,
    },
  },

  description: {
    textAlign: "center",

    [theme.fn.smallerThan("sm")]: {
      fontSize: theme.fontSizes.md,
    },
  },

  // Styles for the sticky image
  stickyImage: {
    position: "fixed",
    top: 64,
    right: theme.spacing.md,
    zIndex: 999, // Ensure it's above other content
  },
}));

interface PrivacyProps {
  htmlContent: string;
}

const Privacy: React.FC<PrivacyProps> = ({ htmlContent }) => {
  const { classes } = useStyles();

  const router = useRouter();
  const { locale: activeLocale } = router;
  const { t } = useTranslation(activeLocale);

  const { colorScheme } = useMantineColorScheme();
  const dark = colorScheme === "dark";

  return (
    <Container size="lg" className={classes.container}>
      {/* Sticky Image */}
      <Image
        width={90}
        height={140}
        src={
          dark
            ? "/datenschutz-siegel-dark-vertical-small.png"
            : "/datenschutz-siegel-light-vertical-small.png"
        }
        className={classes.stickyImage}
        alt="Datenschutz-Siegel"
      />
      {/* Title */}
      <Title className={classes.title}>
        {t("common:app-impressum-privacy-label")}
      </Title>

      {/* Content */}
      <Box
        className="prose"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* Global Styles */}
      <style jsx global>{`
        .prose,
        .prose a,
        .prose h1,
        .prose h2,
        .prose h3,
        .prose h4,
        .prose h5,
        .prose h6 {
          max-width: none; /* or max-width: unset; */
          color: inherit;
        }
        .prose a {
          text-decoration: underline;
        }
        .prose li {
          list-style-type: none;
        }
        ul.prose li::before {
          content: "" !important; /* Set content to empty string */
        }
      `}</style>
    </Container>
  );
};

export default Privacy;
