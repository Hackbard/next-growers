import {
  Button,
  Container,
  Group,
  Image,
  Space,
  Text,
  TextInput,
  Textarea,
  Title,
  createStyles,
  rem,
} from "@mantine/core";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import { IconCloudUpload, IconDownload, IconX } from "@tabler/icons-react";
import { useForm, zodResolver } from "@mantine/form";

import AccessDenied from "~/components/Atom/AccessDenied";
import { ImagePreview } from "~/components/Atom/ImagePreview";
import type { OwnReport } from "~/types";
import { api } from "~/utils/api";
import { handleDrop } from "~/helpers";
import { reportInput } from "~/types";
import toast from "react-hot-toast";
import { useRef } from "react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { z } from "zod";

const useStyles = createStyles((theme) => ({
  wrapper: {
    marginTop: "-1rem",
    position: "relative",
    marginBottom: rem(30),
  },

  dropzone: {
    borderWidth: rem(1),
    paddingBottom: rem(50),
  },

  icon: {
    color:
      theme.colorScheme === "dark"
        ? theme.colors.dark[3]
        : theme.colors.gray[4],
  },

  control: {
    position: "absolute",
    width: rem(250),
    left: `calc(50% - ${rem(125)})`,
    bottom: rem(-20),
  },
}));

const schema = z.object({
  titel: z
    .string()
    .min(12, { message: "Titel should have at least 12 letters" }),
  description: z
    .string()
    .min(42, { message: "Description should have at least 42 letters" }),
  // email: z.string().email({ message: 'Invalid email' }),
  // age: z.number().min(18, { message: 'You must be at least 18 to create an account' }),
});

export default function AddReport() {
  const { classes, theme } = useStyles();
  const openReference = useRef<() => void>(null);
  const [newReport, setNewReport] = useState({
    title: "",
    description: "",
    cloudUrl: "",
  });
  const { data: session } = useSession();
  const trpc = api.useContext();

  const form = useForm({
    validateInputOnChange: true,
    validate: zodResolver(schema),
    initialValues: {
      titel: "",
      description: "",
    },
  });

  if (!session) return <AccessDenied />;

  const { mutate } = api.reports.create.useMutation({
    onMutate: async (newReport) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await trpc.reports.getOwnReports.cancel();

      // Snapshot the previous value
      const previousReports = trpc.reports.getOwnReports.getData();

      // Optimistically update to the new value
      trpc.reports.getOwnReports.setData(undefined, (prev) => {
        const optimisticReport: OwnReport = {
          id: "TEMP_ID", // 'placeholder'
          title: newReport.title,
          description: newReport.description,
          authorId: "",
          authorImage: "",
          authorName: "",
          updatedAt: "",
          createdAt: "",
        };

        // Return optimistically updated reports
        if (!prev) return [optimisticReport];
        return [...prev, optimisticReport];
      });

      // Clear input
      setNewReport({ title: "", description: "", cloudUrl: "" });

      // Return a context object with the snapshotted value
      return { previousReports };
    },
    // If the mutation fails,
    // use the context returned from onMutate to roll back
    onError: (err, newReport, context) => {
      toast.error("An error occured when creating reports");
      // Clear input
      setNewReport({ ...newReport, cloudUrl: "" });
      if (!context) return;
      trpc.reports.getOwnReports.setData(
        undefined,
        () => context.previousReports
      );
    },
    // Always refetch after error or success:
    onSettled: async () => {
      console.log("END api.reports.create.useMutation");
      await trpc.reports.getOwnReports.invalidate();
    },
  });

  const handleDropWrapper = (files: File[]): void => {
    handleDrop(files, setNewReport).catch((error) => {
      console.log(error);
    });
  };

  return (
    <>
      <Container
        size="sm"
        px={0}
        className="flex w-full flex-col space-y-4"
        mx="auto"
      >
        <Space h="xs" />
        <Title order={2}>Preview:</Title>

        <ImagePreview
          image={newReport.cloudUrl}
          title={newReport.title}
          link=""
          author={session.user.name as string}
          comments={0}
          views={83}
        />

        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            const result = reportInput.safeParse(newReport);
            if (!result.success) {
              toast.error(result.error.format()._errors.toString());
              const errorString = result.error.format()._errors.toString();
              return;
            }
            mutate(newReport);
          }}
        >
          <TextInput
            withAsterisk
            label="Titel:"
            placeholder="High Life Chronicles: A Thrilling Cannabis Grow Report"
            {...form.getInputProps("titel")}
            onChange={(e) => {
              setNewReport((prevState) => ({
                ...prevState,
                title: e.target.value,
              }));
            }}
            value={newReport.title}
          />
          <Textarea
            withAsterisk
            label="Report description:"
            placeholder="Welcome to the high life with our epic cannabis grow report! Follow along as we document the journey of cultivating the finest strains of cannabis, from seed to harvest. Our expert growers will share their tips and tricks for producing big, beautiful buds that will blow your mind. Get ready to learn about the best nutrients, lighting, and growing techniques for cultivating potent and flavorful cannabis. So sit back, relax, and enjoy the ride as we take you on a journey through the wonderful world of cannabis cultivation!"
            mt="sm"
            autosize
            minRows={6}
            {...form.getInputProps("description")}
            onChange={(e) => {
              setNewReport((prevState) => ({
                ...prevState,
                description: e.target.value,
              }));
            }}
            value={newReport.description}
          />
          <Space h="sm" />
          {/* {newReport.cloudUrl !== "" && ( */}
          {/*           <Container px={0} className="bg-gr flex flex-col justify-center">
            <Image
              withPlaceholder
              radius="md"
              width={320}
              height={180}
              src={newReport.cloudUrl}
              alt="awsdv"
            />
          </Container> */}
          {/* )} */}
          <label className="mantine-InputWrapper-label mantine-Textarea-label text-sm">
            Upload the report header main image
            <span
              className="mantine-InputWrapper-required mantine-Textarea-required text-red-500"
              aria-hidden="true"
            >
              {" "}
              *
            </span>
          </label>
          <div className={classes.wrapper}>
            <Dropzone
              openRef={openReference}
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              onDrop={handleDropWrapper}
              onChange={(e) => {
                alert(e);
              }}
              className={classes.dropzone}
              radius="md"
              accept={[MIME_TYPES.jpeg, MIME_TYPES.png, MIME_TYPES.gif]}
              maxSize={10 * 1024 ** 2}
            >
              <div style={{ pointerEvents: "none" }}>
                <Group position="center">
                  <Dropzone.Accept>
                    <IconDownload
                      size={rem(50)}
                      color={
                        theme.colorScheme === "dark"
                          ? theme.colors.blue[0]
                          : theme.white
                      }
                      stroke={1.5}
                    />
                  </Dropzone.Accept>
                  <Dropzone.Reject>
                    <IconX
                      size={rem(50)}
                      color={theme.colors.red[6]}
                      stroke={1.5}
                    />
                  </Dropzone.Reject>
                  <Dropzone.Idle>
                    <IconCloudUpload
                      size={rem(50)}
                      color={
                        theme.colorScheme === "dark"
                          ? theme.colors.dark[0]
                          : theme.black
                      }
                      stroke={1.5}
                    />
                  </Dropzone.Idle>
                </Group>

                <Text ta="center" fw={700} fz="lg" mt="xl">
                  <Dropzone.Accept>Drop files here</Dropzone.Accept>
                  <Dropzone.Reject>Only Images, less than 10mb</Dropzone.Reject>
                  <Dropzone.Idle>Upload Images</Dropzone.Idle>
                </Text>
                <Text ta="center" fz="sm" mt="xs" c="dimmed">
                  Drag&apos;n&apos;drop your image here to upload. We can accept
                  only <i>.pdf</i> files that are less than 30mb in size.
                </Text>
              </div>
            </Dropzone>

            {/*             <Button
              className={`${
                theme.colorScheme === "light" ? "text-gray-900" : ""
              } border-1 border-orange-500`}
              size="sm"
              radius="xl"
              onClick={() => refNode.current?.()}
            >
              Select files
            </Button> */}
          </div>

          {/* <NumberInput
            withAsterisk
            label="Age"
            placeholder="Your age"
            mt="sm"
            {...form.getInputProps('age')}
          />  */}

          <Group position="right" mt="xl">
            {/* <Button type="submit" fullWidth className=" 
              font-medium rounded-lg sm:w-auto px-5 py-2 
              bg-gradient-to-r from-pink-600 via-red-600 to-orange-500">
            Create new report! 🚀</Button> */}

            {/*           <Button type="submit" color="orange.6" variant="outline" >
            Create new report! 🚀
            </Button> */}
            <Button
              type="submit"
              // className="border-1 border-orange-500"
              className={`${
                theme.colorScheme === "light" ? "text-gray-900" : ""
              } border-1 border-orange-500`}
              radius="sm"
              uppercase
            >
              Create new report! 🚀
            </Button>
          </Group>
        </form>
      </Container>
    </>
  );
}
