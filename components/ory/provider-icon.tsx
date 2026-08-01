import type { ComponentType } from "react";
import { Icon } from "@iconify/react";
import type { IconifyIcon } from "@iconify/types";
import {
  SiAuthentik,
  SiClerk,
  SiKakao,
  SiKeycloak,
  SiKick,
  SiLine,
  SiOry,
  SiPaypal,
  SiWechat,
} from "@icons-pack/react-simple-icons";
import metaIcon from "@iconify-icons/simple-icons/meta";
import xIcon from "@iconify-icons/simple-icons/x";
import appleIcon from "@iconify-icons/logos/apple";
import auth0Icon from "@iconify-icons/logos/auth0-icon";
import paypalIcon from "@iconify-icons/logos/paypal";
import bitbucketIcon from "@iconify-icons/logos/bitbucket";
import discordIcon from "@iconify-icons/logos/discord-icon";
import dropboxIcon from "@iconify-icons/logos/dropbox";
import githubIcon from "@iconify-icons/logos/github-icon";
import gitlabIcon from "@iconify-icons/logos/gitlab";
import googleIcon from "@iconify-icons/logos/google-icon";
import linkedinIcon from "@iconify-icons/logos/linkedin-icon";
import microsoftIcon from "@iconify-icons/logos/microsoft-icon";
import oktaIcon from "@iconify-icons/logos/okta-icon";
import redditIcon from "@iconify-icons/logos/reddit";
import salesforceIcon from "@iconify-icons/logos/salesforce";
import slackIcon from "@iconify-icons/logos/slack-icon";
import spotifyIcon from "@iconify-icons/logos/spotify-icon";
import tiktokIcon from "@iconify-icons/logos/tiktok";
import twitchIcon from "@iconify-icons/logos/twitch";
import yahooIcon from "@iconify-icons/logos/yahoo";
import zoomIcon from "@iconify-icons/logos/zoom";

import type { UiNode } from "@ory/client-fetch";

import { getProviderName } from "@/lib/ory/flow";

const providerIcons: Record<string, IconifyIcon> = {
  Apple: appleIcon,
  Auth0: auth0Icon,
  Bitbucket: bitbucketIcon,
  Discord: discordIcon,
  Dropbox: dropboxIcon,
  GitHub: githubIcon,
  GitLab: gitlabIcon,
  Google: googleIcon,
  LinkedIn: linkedinIcon,
  Meta: metaIcon,
  Microsoft: microsoftIcon,
  Okta: oktaIcon,
  PayPal: paypalIcon,
  Reddit: redditIcon,
  Salesforce: salesforceIcon,
  Slack: slackIcon,
  Spotify: spotifyIcon,
  TikTok: tiktokIcon,
  Twitch: twitchIcon,
  X: xIcon,
  "Yahoo!": yahooIcon,
  Zoom: zoomIcon,
};

type SimpleProviderIcon = ComponentType<{
  "aria-hidden"?: boolean;
  className?: string;
  color?: string;
  size?: number;
  title?: string;
}>;

const simpleProviderIcons: Record<string, SimpleProviderIcon> = {
  Authentik: SiAuthentik,
  Clerk: SiClerk,
  Kakao: SiKakao,
  Keycloak: SiKeycloak,
  Kick: SiKick,
  LINE: SiLine,
  "Ory OAuth2": SiOry,
  PayPal: SiPaypal,
  WeChat: SiWechat,
};

export function ProviderIcon({ node }: { node: UiNode }) {
  const name = getProviderName(node);
  const icon = providerIcons[name];
  const simpleIcon = simpleProviderIcons[name];
  const SimpleIcon = simpleIcon;
  const iconClassName = getProviderIconClassName(name);

  if (icon) {
    return (
      <Icon
        aria-hidden="true"
        className={iconClassName}
        color={getProviderIconColor(name)}
        icon={icon}
      />
    );
  }

  if (simpleIcon) {
    return (
      <SimpleIcon
        aria-hidden={true}
        className={iconClassName}
        color="default"
        size={20}
        title={name}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex size-5 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground"
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function getProviderIconClassName(name: string) {
  return [
    "size-5 text-foreground",
    ["Apple", "GitHub", "X"].includes(name) ? "dark:invert" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function getProviderIconColor(name: string) {
  return name === "Meta" ? "#0866FF" : undefined;
}

export function hasProviderIcon(name: string) {
  return Boolean(providerIcons[name] || simpleProviderIcons[name]);
}
