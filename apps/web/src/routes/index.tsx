/* eslint-disable jsx-a11y/media-has-caption */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { APP_TITLE } from '@/utils/constant';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Helmet } from 'react-helmet-async';
import coverImg from '@/assets/images/cover.png';
import { ArrowRightIcon, PlayCircleIcon } from 'lucide-react';
import { Fragment, useState } from 'react';
import { UiButton, UiLogo } from '@altdot/ui';
import banner1 from '@/assets/images/banner-1.png';
import video1 from '@/assets/videos/banner-1.mp4';
import banner2 from '@/assets/images/banner-2.png';
import video2 from '@/assets/videos/banner-2.mp4';
import banner3 from '@/assets/images/banner-3.png';
import video3 from '@/assets/videos/banner-3.mp4';
import banner4 from '@/assets/images/banner-4.png';
import video4 from '@/assets/videos/banner-4.mp4';
import chromeWebStore from '@/assets/images/chrome-webstore.png';
import firefoxAddon from '@/assets/images/firefox-addon.png';
import { useIntersectionObserver } from 'usehooks-ts';
import StoreListItems from '@/components/store/StoreListItems';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import ExtensionStoreCard from '@/components/extension/ExtensionStoreCard';
import { storeExtensionQuery } from '@/utils/queries/store';

export const Route = createFileRoute('/')({
  component: LandingPage,
});

function HeadingSection() {
  const [showIframe, setShowIframe] = useState(false);

  function downloadWindows() {
    window.open(
      'https://github.com/kholid060/alt./releases/latest/download/alt-windows-setup.exe',
      '_self',
    );
  }

  return (
    <section className="container pt-32 text-center md:pt-52">
      <div className="absolute left-0 top-0 -z-10 h-5/6 w-9/12 bg-gradient-to-br from-transparent via-primary/30 to-transparent to-40% dark:from-transparent dark:via-primary/10"></div>
      <h1 className="text-4xl font-semibold md:text-5xl">
        An extendable launcher.
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-muted-foreground md:text-lg">
        From launcher to automation. Search apps, access productivity tools, and
        workflow automation within one app
      </p>
      <div className="mt-20">
        <UiButton size="lg" onClick={downloadWindows}>
          Download for Windows
        </UiButton>
        <p className="mt-1 text-sm text-muted-foreground">Windows 11</p>
      </div>
      <div
        className="group relative mt-28 aspect-video cursor-pointer overflow-hidden rounded-md ring-8 ring-muted md:mt-64"
        onClick={() => setShowIframe(true)}
      >
        {showIframe ? (
          <iframe
            className="h-full w-full"
            src="https://www.youtube-nocookie.com/embed/CLuXBQr4PNQ?si=aZX-K6jKB-N-jqG5&amp;controls=0&autoplay=1"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <>
            <img src={coverImg} className="h-full w-full" alt="alt. app" />
            <div className="absolute left-0 top-0 z-10 h-full w-full bg-black/25"></div>
            <PlayCircleIcon className="absolute left-1/2 top-1/2 z-20 size-20 -translate-x-1/2 -translate-y-1/2 transition-all group-hover:size-24" />
          </>
        )}
      </div>
    </section>
  );
}

interface FeatureCardItem {
  imgSrc: string;
  videoSrc: string;
  title: string | React.ReactNode;
  description: string | React.ReactNode;
}

function FeatureCard({ item }: { item: FeatureCardItem }) {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className="rounded-lg bg-card p-2 md:p-4">
      <div className="p-4 md:p-6">
        <h2 className="text-lg font-semibold md:text-xl">{item.title}</h2>
        <div className="mt-1.5 text-sm text-muted-foreground md:text-base">
          {item.description}
        </div>
      </div>
      <div className="mt-4 aspect-video overflow-hidden rounded-xl">
        {showVideo ? (
          <video
            src={item.videoSrc}
            autoPlay
            loop
            muted
            controls
            controlsList="nodownload"
          />
        ) : (
          <div
            onClick={() => setShowVideo(true)}
            className="group relative cursor-pointer"
          >
            <img
              src={item.imgSrc}
              className="h-full w-full object-cover object-center"
              alt="banner"
            />
            <PlayCircleIcon className="absolute left-1/2 top-1/2 z-20 size-14 -translate-x-1/2 -translate-y-1/2 transition-all group-hover:size-16" />
          </div>
        )}
      </div>
    </div>
  );
}

function PopularExtensionsSection() {
  const query = useInfiniteQuery({
    enabled: false,
    refetchOnMount: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    ...storeExtensionQuery({ sortBy: 'most-installed' }),
  });

  const [ref, isIntersecting] = useIntersectionObserver({ threshold: 0.4 });

  if (
    isIntersecting &&
    (query.status === 'pending' || query.status === 'error')
  ) {
    query.refetch();
  }

  return (
    <section ref={ref} className="container mt-72 flex flex-col items-end">
      <h2 className="text-2xl font-semibold md:text-3xl">Popular Extensions</h2>
      <Link
        to="/store/extensions"
        search={{ sortBy: 'most-installed' }}
        className="group mt-1 text-muted-foreground"
      >
        Open store to see more{' '}
        <ArrowRightIcon className="inline size-4 align-middle transition-transform group-hover:translate-x-1" />
      </Link>
      <StoreListItems
        className="mt-12 w-full gap-4 text-left md:w-10/12 md:grid-cols-2 lg:grid-cols-3"
        query={query}
        renderList={(items) =>
          items.pages.map((group, index) => (
            <Fragment key={index}>
              {group.items.slice(0, 6).map((extension) => (
                <ExtensionStoreCard extension={extension} key={extension.id} />
              ))}
            </Fragment>
          ))
        }
      />
    </section>
  );
}

function FeatureSection() {
  return (
    <section className="container mt-72 grid grid-cols-12 gap-6">
      <div className="col-span-12 space-y-6 md:col-span-6">
        <FeatureCard
          item={{
            title: 'All Tasks at Your Fingertips',
            imgSrc: banner1,
            videoSrc: video1,
            description:
              'Search and launch apps, perform quick maths calculations, kill running processes, and more without lifting your fingers off the keyboard.',
          }}
        />
        <FeatureCard
          item={{
            title: 'Extend Your Browser',
            imgSrc: banner3,
            videoSrc: video3,
            description: (
              <>
                The <UiLogo /> browser extension can help you fill the web
                forms, extract the web page content, interact with the web page,
                and provide more context to the <UiLogo /> app.
                <div className="mt-6 hidden items-center gap-4 md:flex">
                  <a
                    href="https://chromewebstore.google.com/detail/bhkjbkibpamjgdhcofhepndnjhmlfbjf"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      src={chromeWebStore}
                      alt="Chrome Web Store"
                      className="h-12"
                    />
                  </a>
                  <a
                    href="https://addons.mozilla.org/en-US/firefox/addon/alt-browser-extension/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      src={firefoxAddon}
                      alt="Firefox Addon"
                      className="h-12"
                    />
                  </a>
                </div>
              </>
            ),
          }}
        />
      </div>
      <div className="col-span-12 space-y-6 md:col-span-6">
        <FeatureCard
          item={{
            title: 'Do More with Workflow',
            imgSrc: banner2,
            videoSrc: video2,
            description:
              "Use the workflow editor to perform complex actions, do repetitive tasks, or link the extension's commands.",
          }}
        />
        <FeatureCard
          item={{
            title: 'Quick Access to Your Favorite Commands',
            imgSrc: banner4,
            videoSrc: video4,
            description:
              'Use deep-link or assign hotkeys or aliases to speed up access to commands you always use.',
          }}
        />
      </div>
    </section>
  );
}

function LandingPage() {
  return (
    <main className="mt-24 pb-48">
      <Helmet>
        <title>{APP_TITLE}</title>
      </Helmet>
      <HeadingSection />
      <FeatureSection />
      <PopularExtensionsSection />
    </main>
  );
}
/** Damn I'm suck at this */
