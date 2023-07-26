"use client";

import { useMemo } from "react";
import useSWRImmutable from "swr/immutable";
import { BarChart, Card, Color, Title } from "@tremor/react";
import { Stats } from "@/components/Stats";
import { StatsResponse } from "@/app/api/user/stats/route";
import { LoadingContent } from "@/components/LoadingContent";
import {
  StatsByDayQuery,
  StatsByDayResponse,
} from "@/app/api/user/stats/day/route";

export default function StatsPage() {
  return (
    <div className="pb-20">
      <StatsSummary />

      <div className="mt-4 grid gap-4 px-4 md:grid-cols-3">
        <div>
          <StatsChart type="inbox" title="Unhandled Emails" color="blue" />
        </div>
        <div>
          <StatsChart type="archived" title="Archived Emails" color="lime" />
        </div>
        <div>
          <StatsChart type="sent" title="Sent Emails" color="slate" />
        </div>
      </div>

      <div className="mt-4 px-4">
        <CombinedStatsChart title="Combined Chart" />
      </div>
    </div>
  );
}

function StatsSummary() {
  const { data, isLoading, error } =
    useSWRImmutable<StatsResponse>(`/api/user/stats`);

  return (
    <LoadingContent loading={isLoading} error={error}>
      {data && (
        <div>
          <Stats
            stats={[
              {
                name: "Emails received (last 24h)",
                value: data.emailsReceived24hrs || 0,
              },
              {
                name: "Unhandled emails (last 24h)",
                value: data.emailsInbox24hrs || 0,
              },
              {
                name: "Emails sent (last 24h)",
                value: data.emailsSent24hrs || 0,
              },

              {
                name: "Emails received (last 7d)",
                value: data.emailsReceived7days || 0,
                subvalue: `${((data.emailsReceived7days || 0) / 7).toFixed(
                  1
                )} per day`,
              },
              {
                name: "Unhandled emails (last 7d)",
                value: data.emailsInbox7days || 0,
                subvalue: `${((data.emailsInbox7days || 0) / 7).toFixed(
                  1
                )} per day`,
              },
              {
                name: "Emails sent (last 7d)",
                value: data.emailsSent7days || 0,
                subvalue: `${((data.emailsSent7days || 0) / 7).toFixed(
                  1
                )} per day`,
              },
            ]}
          />
        </div>
      )}
    </LoadingContent>
  );
}

function StatsChart(props: {
  title: string;
  type: StatsByDayQuery["type"];
  color: Color;
}) {
  const searchParams: StatsByDayQuery = { type: props.type };
  const { data, isLoading, error } = useSWRImmutable<
    StatsByDayResponse,
    { error: string }
  >(`/api/user/stats/day?${new URLSearchParams(searchParams).toString()}`);

  return (
    <LoadingContent loading={isLoading} error={error}>
      {data && (
        <div className="mx-auto max-w-2xl">
          <Card>
            <Title>{props.title}</Title>
            <BarChart
              className="mt-4 h-72"
              data={data}
              index="date"
              categories={["Emails"]}
              colors={[props.color]}
            />
          </Card>
        </div>
      )}
    </LoadingContent>
  );
}

function CombinedStatsChart(props: { title: string }) {
  const {
    data: sentData,
    isLoading: sentIsLoading,
    error: sentError,
  } = useSWRImmutable<StatsByDayResponse, { error: string }>(
    `/api/user/stats/day?${new URLSearchParams({
      type: "sent",
    } as StatsByDayQuery).toString()}`
  );

  const {
    data: archivedData,
    isLoading: archivedIsLoading,
    error: archivedError,
  } = useSWRImmutable<StatsByDayResponse, { error: string }>(
    `/api/user/stats/day?${new URLSearchParams({
      type: "archived",
    } as StatsByDayQuery).toString()}`
  );

  const {
    data: inboxData,
    isLoading: inboxIsLoading,
    error: inboxError,
  } = useSWRImmutable<StatsByDayResponse, { error: string }>(
    `/api/user/stats/day?${new URLSearchParams({
      type: "inbox",
    } as StatsByDayQuery).toString()}`
  );

  const isLoading = sentIsLoading || archivedIsLoading || inboxIsLoading;
  const error = sentError || archivedError || inboxError;
  const hasAllData = sentData && archivedData && inboxData;

  const data = useMemo(() => {
    if (!hasAllData) return [];

    const data: {
      date: string;
      Unhandled: number;
      Archived: number;
      Sent: number;
    }[] = [];

    for (let i = 0; i < inboxData.length; i++) {
      data.push({
        date: inboxData[i].date,
        Unhandled: inboxData[i].Emails,
        Archived: archivedData[i].Emails,
        Sent: sentData[i].Emails,
      });
    }

    return data;
  }, [archivedData, hasAllData, inboxData, sentData]);

  return (
    <LoadingContent loading={isLoading} error={error}>
      {hasAllData && (
        <div className="mx-auto">
          <Card>
            <Title>{props.title}</Title>
            <BarChart
              className="mt-4 h-72"
              data={data}
              index="date"
              categories={["Unhandled", "Archived", "Sent"]}
              colors={["blue", "lime", "slate"]}
            />
          </Card>
        </div>
      )}
    </LoadingContent>
  );
}
