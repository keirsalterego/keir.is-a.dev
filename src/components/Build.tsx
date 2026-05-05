import { onMount, createSignal, Show, Switch, Match, For } from "solid-js";
import type { Component } from "solid-js";
import { OhVueIcons, OhMyCV } from "./icons";
import type { BuildItem } from "@types";

export const Build: Component<{ build: BuildItem }> = (props) => {
  /* eslint-disable-next-line solid/reactivity */
  const api = "https://api.github.com/repos/" + props.build.repo;
  const [star, setStar] = createSignal<string>();

  const getRepoStars = async () => {
    const data = await fetch(api).then((res) => res.json());
    return data.stargazers_count;
  };

  onMount(async () => props.build.repo && setStar(await getRepoStars()));

  const isGithubLink = props.build.link?.includes("github.com/") ?? false;
  const liveHref = props.build.link && !isGithubLink ? props.build.link : undefined;
  const repoHref = props.build.repo
    ? `https://github.com/${props.build.repo}`
    : isGithubLink
      ? props.build.link
      : undefined;

  return (
    <article class="build-card relative hstack gap-x-5 p-4 !no-underline !text-fg">
      <div flex-auto h-full>
        <div class="hstack flex-wrap">
          <div whitespace-nowrap mr-3>
            {props.build.name}
          </div>
          <div hstack gap-x-2>
            <For each={props.build.tech}>
              {(icon) => <span class={`tech-icon ${icon}`} />}
            </For>

            <Show when={star()}>
              <span hstack gap-x-1>
                <span i-noto-v1:star text-xs />
                <span class="text-sm mt-0.5">{star()}</span>
              </span>
            </Show>
          </div>
        </div>
        <div mt-1 text="sm fg-light" innerHTML={props.build.desc} />
        <div class="build-links" mt-3>
          <Show when={liveHref}>
            <a class="build-link-btn" href={liveHref} target="_blank" rel="noopener noreferrer">
              Live
            </a>
          </Show>
          <Show when={repoHref}>
            <a class="build-link-btn" href={repoHref} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </Show>
        </div>
      </div>

      <div pt-2 text="3xl fg-light">
        <Switch fallback={<div class={props.build.icon || "i-carbon-unknown"} />}>
          <Match when={props.build.icon === "oh-vue-icons"}>
            <OhVueIcons />
          </Match>
          <Match when={props.build.icon === "oh-my-cv"}>
            <OhMyCV />
          </Match>
        </Switch>
      </div>
    </article>
  );
};

export default Build;
