import type { ProductStory } from "./types";

export const calendar: ProductStory = {
  problem: {
    title: "Calendars and contacts on your own mail server, in every calendar app",
    headline: "Your meetings say more about the company than your email",
    text: "Who meets which customer, when the board sits, which candidate comes in on Tuesday: a hosted calendar keeps all of it abroad. Calendar keeps calendars and address books on the same Stalwart server as Mail, over CalDAV and CardDAV, so the phone's own calendar, Outlook and Thunderbird work as they are. The webmail gets a calendar view with invitations, free/busy and room booking.",
    example:
      "Jane invites Ali and a customer to a demo on Thursday. Calendar shows Ali is free at 14:00, books the meeting room, and sends the invitation from Jane's mailbox with a Meet link. The customer accepts from Gmail, and the answer lands in Jane's calendar.",
  },
  who: ["Everyone in the company, who plans their day", "Assistants and managers, who book for others"],
  glance: [
    {
      label: "Runs on",
      value: "Stalwart, with Mail",
    },
    {
      label: "Apps",
      value: "CalDAV and CardDAV",
    },
    {
      label: "Invitations",
      value: "To anyone, by email",
    },
    {
      label: "Rooms",
      value: "Booked like people",
    },
  ],
  flow: [
    {
      label: "Calendars",
      detail: "Each mailbox has its own; teams get shared ones, set in the domains file.",
    },
    {
      label: "Invite",
      detail: "Invitations go out by email in the standard format, so any calendar can answer.",
    },
    {
      label: "Free/busy",
      detail: "Colleagues see when you are busy, not what the meeting is, unless you share it.",
    },
    {
      label: "On every device",
      detail: "Phones and desktop apps sync over CalDAV and CardDAV with a device password.",
    },
  ],
  checks: [
    {
      title: "Calendar",
      items: ["Day, week and month views in the webmail", "Invitations, answers and reminders", "Rooms and equipment that can be booked"],
    },
    {
      title: "Contacts",
      items: ["A personal address book per person", "The company directory from Identity", "Shared address books by team"],
    },
  ],
  decides: [
    {
      label: "Privacy",
      text: "Others see only free or busy for your events unless you share a calendar with them.",
    },
    {
      label: "Rooms",
      text: "A room accepts an invitation when it is free and declines when it is not.",
    },
    {
      label: "Leaving",
      text: "When someone leaves, their future meetings are listed for their manager to hand over.",
    },
  ],
  inputs: [
    {
      name: "Calendar apps",
      how: "Any app that speaks CalDAV and CardDAV.",
    },
    {
      name: "Import",
      how: "ICS and vCard files from the old provider.",
    },
  ],
  screens: [
    {
      page: "week",
      title: "Week",
      shows: "A person's week across their own and shared calendars, with invitations to answer and the open meeting.",
      story: "week",
    },
    { page: "rooms", title: "Rooms", shows: "Each room's bookings for the day, and what a room accepts on its own.", story: "rooms" },
    { page: "contacts", title: "Contacts", shows: "The company directory from Identity, a person's own contacts and a team's shared ones.", story: "contacts" },
    {
      page: "sharing",
      title: "Sharing",
      shows: "Who sees which calendar, the addresses for calendar apps, and meetings to hand over when someone leaves.",
      story: "sharing",
    },
  ],
  worksWith: [
    {
      id: "mail",
      how: "Calendars live on Mail's server; invitations go out from the mailbox.",
    },
    {
      id: "meet",
      how: "Meetings get a Meet link.",
    },
    {
      id: "identity",
      how: "The company directory comes from Identity.",
    },
    {
      id: "hr",
      how: "Leave from HR shows as busy.",
    },
  ],
  limits: [
    "Designed: the screens are in Storybook; it is not built yet.",
    "Mail must be installed; Calendar uses its server.",
    "Exchange ActiveSync is not supported; phones use CalDAV and CardDAV.",
  ],
};
