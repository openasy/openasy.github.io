import type { ProductStory } from "./types";

export const meet: ProductStory = {
  problem: {
    title: "Video meetings in the browser, with screen sharing, kept in your install",
    headline: "A meeting about your customers should not pass through a stranger's servers",
    text: "Sales calls, board meetings and job interviews run through hosted video services abroad. Meet runs video meetings in your install on a proven open-source media server: a link from Calendar or Chat opens a meeting in the browser, with screen sharing, a lobby for guests and no app to install.",
    example:
      "A candidate gets a Calendar invitation with a Meet link. At 10:00 they open it in their browser, wait in the lobby until the interviewer lets them in, and share their screen to walk through their work. Nothing of the call is stored.",
  },
  who: ["Everyone who meets, inside or outside the company", "IT, who need meetings that work behind the company's network"],
  glance: [
    {
      label: "Runs on",
      value: "Your own server",
    },
    {
      label: "Joins from",
      value: "A browser, no app",
    },
    {
      label: "Guests",
      value: "Through a lobby",
    },
    {
      label: "Recordings",
      value: "Off unless allowed",
    },
  ],
  flow: [
    {
      label: "Link",
      detail: "Each meeting has a link, made by Calendar or Chat, or by hand.",
    },
    {
      label: "Lobby",
      detail: "People outside the company wait until someone inside lets them in.",
    },
    {
      label: "Meet",
      detail: "Video, audio and screen sharing in the browser, on phones too.",
    },
    {
      label: "End",
      detail: "Nothing is kept after the call unless recording was allowed and started.",
    },
  ],
  checks: [
    {
      title: "In a meeting",
      items: ["Video, audio and screen sharing", "A lobby for guests", "Chat during the call"],
    },
    {
      title: "For IT",
      items: ["Media through your own server and TURN", "Participants and length per meeting", "Recording only where the file allows it"],
    },
  ],
  decides: [
    {
      label: "Guests",
      text: "People without a company account join only through the lobby, and only while someone from the company is in the meeting.",
    },
    {
      label: "Recording",
      text: "A meeting is recorded only when its organiser allows it and everyone sees that it is.",
    },
    {
      label: "Size",
      text: "A meeting holds as many people as the server's bandwidth allows; the limit is set in the file.",
    },
  ],
  inputs: [
    {
      name: "Calendar and Chat",
      how: "Make meeting links.",
    },
    {
      name: "Browsers",
      how: "Any current browser, on desktop and phone.",
    },
  ],
  screens: [
    { page: "meeting", title: "Meeting", shows: "The call, with its shared screen, everyone's tile and a guest waiting in the lobby.", story: "meeting" },
    { page: "meetings", title: "Meetings", shows: "Meetings today, where each link came from and how many joined.", story: "meetings" },
    { page: "recordings", title: "Recordings", shows: "The few recorded meetings, who allowed them and when each file is deleted.", story: "recordings" },
    { page: "server", title: "Server", shows: "Media server and TURN health, and how each person connects.", story: "server" },
  ],
  worksWith: [
    {
      id: "calendar",
      how: "Invitations carry a Meet link.",
    },
    {
      id: "chat",
      how: "A call starts from a channel.",
    },
    {
      id: "identity",
      how: "People from the company sign in to skip the lobby.",
    },
  ],
  limits: [
    "Designed: the screens are in Storybook; it is not built yet.",
    "Built on an existing open-source media server, chosen before work starts.",
    "Webinars for hundreds of viewers are out of scope.",
  ],
};
