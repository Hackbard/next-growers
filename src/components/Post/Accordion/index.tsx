import { useState } from "react";
import { Accordion, Container, Paper, Title } from "@mantine/core";
import { IsoReportWithPostsFromDb, Posts } from "~/types";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import AddPost from "../AddForm/index";

interface PostsAccordionProps {
  report: IsoReportWithPostsFromDb | undefined;
}

const PostsAccordion = ({ report: isoReport }: PostsAccordionProps) => {
  const router = useRouter();
  const { locale: activeLocale } = router;
  const { t } = useTranslation(activeLocale);

  const [postIsOpen, setPostIsOpen] = useState<string | null>(null);

  return (
    <div>
      <Container p={0}>
        <Title order={2}> {t("common:editallpost-headline")} </Title>
        <Paper withBorder>
          <Accordion value={postIsOpen} onChange={setPostIsOpen}>
            {!!isoReport &&
              isoReport.posts.map(post => (
                <Accordion.Item key={post.id} value={post.id}>
                  <Accordion.Control>{post.date}</Accordion.Control>
                  <Accordion.Panel>
                    <Title order={3}>{post.title}</Title>

                    <AddPost isoReport={isoReport} post={post} />
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
          </Accordion>
        </Paper>
      </Container>
    </div>
  );
};

export default PostsAccordion;
