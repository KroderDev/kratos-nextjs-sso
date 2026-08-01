import type { ComponentType } from "react";
import { Icon } from "@iconify/react";
import type { IconifyIcon } from "@iconify/types";
import SiAuthentik from "@icons-pack/react-simple-icons/icons/SiAuthentik.mjs";
import SiClerk from "@icons-pack/react-simple-icons/icons/SiClerk.mjs";
import SiKakao from "@icons-pack/react-simple-icons/icons/SiKakao.mjs";
import SiKeycloak from "@icons-pack/react-simple-icons/icons/SiKeycloak.mjs";
import SiKick from "@icons-pack/react-simple-icons/icons/SiKick.mjs";
import SiLine from "@icons-pack/react-simple-icons/icons/SiLine.mjs";
import SiOry from "@icons-pack/react-simple-icons/icons/SiOry.mjs";
import SiPaypal from "@icons-pack/react-simple-icons/icons/SiPaypal.mjs";
import SiWechat from "@icons-pack/react-simple-icons/icons/SiWechat.mjs";
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

/**
 * Displays the icon associated with an Ory provider node.
 *
 * @param node - Ory UI node identifying the provider
 * @returns The provider icon, or a badge containing the provider's initial when no icon is available
 */
export function ProviderIcon({ node }: { node: UiNode }) {
  const name = getProviderName(node);
  const icon = providerIcons[name];
  const simpleIcon = simpleProviderIcons[name];
  const SimpleIcon = simpleIcon;
  const iconClassName = getProviderIconClassName(name);

  if (icon) {
    return (
      <span aria-hidden="true" className={iconClassName}>
        <Icon
          color={getProviderIconColor(name)}
          icon={icon}
        />
      </span>
    );
  }

  if (simpleIcon) {
    return (
      <SimpleIcon
        aria-hidden={true}
        className={iconClassName}
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

/**
 * Builds the standard CSS classes for a provider icon.
 *
 * @param name - The provider name used to determine dark-mode styling
 * @returns A space-separated string of CSS classes
 */
export function getProviderIconClassName(name: string) {
  return [
    "size-5 text-foreground",
    ["Apple", "GitHub", "X"].includes(name) ? "dark:invert" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Gets the brand color for a provider icon.
 *
 * @param name - The provider name
 * @returns Meta's brand color, or `undefined` when no custom color is defined
 */
export function getProviderIconColor(name: string) {
  return name === "Meta" ? "#0866FF" : undefined;
}

/**
 * Determines whether an icon is available for a provider.
 *
 * @param name - The provider name
 * @returns `true` if an icon is registered for the provider, `false` otherwise.
 */
export function hasProviderIcon(name: string) {
  return Boolean(providerIcons[name] || simpleProviderIcons[name]);
}
