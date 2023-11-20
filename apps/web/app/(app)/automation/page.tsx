"use client";

import useSWR from "swr";
// import { List } from "@/components/email-list/EmailList";
import { useSearchParams } from "next/navigation";
import { LoadingContent } from "@/components/LoadingContent";
import { PlannedResponse } from "@/app/api/user/planned/route";
import { Button } from "@/components/Button";
import { postRequest } from "@/utils/api";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import {
  ExecutePlanBody,
  ExecutePlanResponse,
} from "@/app/api/user/planned/[id]/controller";
import { useState } from "react";
import { toastError, toastSuccess } from "@/components/Toast";
import { Tabs } from "@/components/Tabs";
import { PlanHistoryResponse } from "@/app/api/user/planned/history/route";
import { PlanBadge } from "@/components/PlanBadge";
import { RulesSection } from "@/app/(app)/automation/RulesSection";
import { SectionDescription } from "@/components/Typography";
import { TopSection } from "@/components/TopSection";
import { AlertBasic } from "@/components/Alert";
import { PremiumAlert, usePremium } from "@/components/PremiumAlert";

export default function PlannedPage() {
  const params = useSearchParams();
  const selectedTab = params.get("tab") || "history";

  const { isPremium } = usePremium();

  return (
    <div>
      <TopSection
        title="AI Automation"
        descriptionComponent={
          <>
            <SectionDescription>
              Set rules for our AI to handle incoming emails automatically.
            </SectionDescription>
            <SectionDescription>
              Run in planning mode to see what the AI would do without it
              actually doing anything. Alternatively, activate automated mode to
              enable the AI to automatically process your emails.
            </SectionDescription>
            {!isPremium && (
              <div className="mt-4">
                <PremiumAlert />
              </div>
            )}
          </>
        }
      />

      <div className="border-b border-gray-200 bg-white shadow-sm">
        <RulesSection />
      </div>

      <div className="mb-8 sm:px-4">
        <div className="p-2">
          <Tabs
            selected={selectedTab}
            tabs={[
              {
                label: "History",
                value: "history",
                href: "/automation?tab=history",
              },
              {
                label: "Planned",
                value: "planned",
                href: "/automation?tab=planned",
              },
            ]}
            breakpoint="md"
          />
        </div>

        {selectedTab === "planned" && <Planned />}
        {selectedTab === "history" && <PlanHistory />}
      </div>
    </div>
  );
}

function Planned() {
  const { data, isLoading, error, mutate } = useSWR<PlannedResponse>(
    "/api/user/planned",
    {
      keepPreviousData: true,
      dedupingInterval: 1_000,
    }
  );

  const [executing, setExecuting] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  return (
    <LoadingContent loading={isLoading} error={error}>
      {/* {data && <List emails={data?.messages || []} refetch={mutate} />} */}
      {data?.messages?.length ? (
        <div className="">
          {/* <List emails={data.messages || []} refetch={mutate} /> */}
          {data.messages.map((message) => {
            return (
              <div
                key={message.id}
                className="flex items-center justify-between border-b border-gray-200 p-4"
              >
                <div>
                  {message.snippet ||
                    message.parsedMessage.textPlain?.substring(0, 100) ||
                    message.parsedMessage.headers?.from}
                </div>
                <div className="ml-4 flex items-center">
                  <div className="whitespace-nowrap">
                    {message.plan.rule?.actions.map((a) => a.type).join(", ") ||
                      "No plan"}
                  </div>
                  <div className="ml-2 flex space-x-2">
                    <Button
                      color="white"
                      roundedSize="full"
                      loading={executing}
                      onClick={async () => {
                        if (!message.plan.rule) return;

                        setExecuting(true);

                        try {
                          await postRequest<
                            ExecutePlanResponse,
                            ExecutePlanBody
                          >(`/api/user/planned/${message.plan.id}`, {
                            email: {
                              subject: message.parsedMessage.headers.subject,
                              from: message.parsedMessage.headers.from,
                              to: message.parsedMessage.headers.to,
                              cc: message.parsedMessage.headers.cc,
                              replyTo:
                                message.parsedMessage.headers["reply-to"],
                              references:
                                message.parsedMessage.headers["references"],
                              date: message.parsedMessage.headers.date,
                              headerMessageId:
                                message.parsedMessage.headers["message-id"],
                              textPlain:
                                message.parsedMessage.textPlain || null,
                              textHtml: message.parsedMessage.textHtml || null,
                              snippet: message.snippet || null,
                              messageId: message.id || "",
                              threadId: message.threadId || "",
                            },
                            ruleId: message.plan.rule.id,
                            actions: message.plan.rule.actions,
                            args: message.plan.functionArgs,
                          });

                          toastSuccess({ description: "Executed!" });
                        } catch (error) {
                          console.error(error);
                          toastError({
                            description: "Unable to execute plan :(",
                          });
                        }

                        setExecuting(false);
                      }}
                    >
                      <CheckCircleIcon className="h-6 w-6" />
                    </Button>

                    <Button
                      color="white"
                      roundedSize="full"
                      loading={rejecting}
                      onClick={() => {
                        setRejecting(true);

                        setTimeout(() => {
                          setRejecting(false);
                        }, 1_000);
                      }}
                    >
                      <XCircleIcon className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <AlertBasic
          title="No planned actions"
          description="Set rules above for our AI to handle incoming emails for you."
        />
      )}
    </LoadingContent>
  );
}

function PlanHistory() {
  const { data, isLoading, error } = useSWR<PlanHistoryResponse>(
    "/api/user/planned/history",
    {
      keepPreviousData: true,
    }
  );

  return (
    <LoadingContent loading={isLoading} error={error}>
      <div className="">
        {data?.history.map((h) => {
          return (
            <div
              key={h.id}
              className="flex items-center justify-between border-b border-gray-200 px-4 py-3"
            >
              <div className="whitespace-nowrap">
                <PlanBadge
                  plan={{
                    rule: {
                      name: h.rule?.name || "",
                      actions: h.actions.map((actionType) => {
                        return { type: actionType };
                      }),
                    },
                    databaseRule: {
                      instructions: h.rule?.instructions || "",
                    },
                  }}
                />
              </div>
              {/* {JSON.stringify(h, null, 2)} */}
              <div>
                {h.actions.map((action, i) => {
                  return (
                    <div key={i} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="font-semibold">{action}</div>
                          {/* <div className="text-gray-500">{a.args}</div> */}
                        </div>
                        {/* <div className="text-gray-500">{a.createdAt}</div> */}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="">
                {Object.entries(h.data as any).map(
                  ([key, value]: [string, any]) => {
                    return (
                      <div key={key} className="flex items-center space-x-2">
                        <div className="font-semibold">{key}</div>
                        <div className="text-gray-500">{value}</div>
                      </div>
                    );
                  }
                )}
              </div>
              <div className="">{h.automated ? "Automated" : "Manual"}</div>
            </div>
          );
        })}
      </div>
      {!data?.history?.length && (
        <div className="px-2">
          <AlertBasic
            title="No history"
            description="You have no history of AI automations yet."
          />
        </div>
      )}
    </LoadingContent>
  );
}
