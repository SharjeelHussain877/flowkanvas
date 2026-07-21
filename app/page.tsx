"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Copy,
  Check,
  ChevronDown,
  Code2,
  FileCheck,
  FileSpreadsheet,
  FileText,
  KeyRound,
  LayoutTemplate,
  Menu,
  Receipt,
  ScrollText,
  Shield,
  Sparkles,
  Variable,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
] as const;

const trustHighlights = [
  "Dynamic Variables",
  "API Key Authentication",
  "Auto Generated Docs",
  "Fast PDF Generation",
  "No Fixed Fields",
] as const;

const howItWorksSteps = [
  {
    step: "01",
    title: "Create Template",
    description: "Upload or design a PDF template in the editor.",
    icon: LayoutTemplate,
  },
  {
    step: "02",
    title: "Add Variables",
    description: "Insert placeholders like {{customer_name}} anywhere.",
    icon: Variable,
  },
  {
    step: "03",
    title: "Generate API Key",
    description: "Create a secure key scoped to your workspace.",
    icon: KeyRound,
  },
  {
    step: "04",
    title: "Receive PDF",
    description: "POST your data and get a generated PDF instantly.",
    icon: FileCheck,
  },
] as const;

const features = [
  {
    title: "Template Editor",
    description: "Create reusable PDF templates with a visual editor.",
    icon: LayoutTemplate,
  },
  {
    title: "Dynamic Variables",
    description:
      "Use unlimited placeholders such as {{name}}, {{company}}, and {{invoice_number}}.",
    icon: Variable,
  },
  {
    title: "API Keys",
    description: "Secure PDF generation with revocable, scoped API keys.",
    icon: KeyRound,
  },
  {
    title: "Auto Documentation",
    description: "Documentation updates automatically when variables change.",
    icon: BookOpen,
  },
] as const;

const apiBenefits = [
  { label: "FormData Support", icon: Code2 },
  { label: "Secure API Keys", icon: Shield },
  { label: "PDF Response", icon: FileText },
  { label: "Auto Generated Docs", icon: Sparkles },
] as const;

const useCases = [
  {
    title: "Invoices",
    description: "Generate branded invoices from order data.",
    icon: Receipt,
  },
  {
    title: "Offer Letters",
    description: "Personalize offers at scale for new hires.",
    icon: ScrollText,
  },
  {
    title: "Contracts",
    description: "Fill agreements with client-specific terms.",
    icon: FileText,
  },
  {
    title: "Certificates",
    description: "Issue completion and achievement certificates.",
    icon: BadgeCheck,
  },
  {
    title: "Reports",
    description: "Produce data-driven PDF reports on demand.",
    icon: FileSpreadsheet,
  },
  {
    title: "Receipts",
    description: "Send transaction receipts programmatically.",
    icon: Receipt,
  },
] as const;

const apiCodeExample = `const form = new FormData();

form.append("name", "John Doe");
form.append("company", "Acme Inc");

await fetch("/api/v1/templates/template-id/generate", {
  method: "POST",
  headers: {
    "X-API-Key": "pk_live_xxxxx"
  },
  body: form
});`;

const faqItems = [
  {
    question: "How does PDF generation work?",
    answer:
      "Create a template with placeholders, send a POST request with your variable values as FormData, and receive a rendered PDF in the response. The API merges your data into the template and returns the finished document.",
  },
  {
    question: "Can I create custom variables?",
    answer:
      "Yes. Add any placeholder in double curly braces - for example {{customer_name}} or {{invoice_id}}. Variables are detected automatically and reflected in your API documentation.",
  },
  {
    question: "Is there a template limit?",
    answer:
      "During the free beta you can create up to 100 templates. Paid plans with higher limits are coming soon.",
  },
  {
    question: "How is API access secured?",
    answer:
      "Each workspace uses API keys with scoped permissions. Keys are transmitted via the X-API-Key header, can be rotated at any time, and never appear in client-side code you ship to browsers.",
  },
  {
    question: "Does documentation update automatically?",
    answer:
      "Yes. When you add, rename, or remove variables in a template, the generated API docs update to match - no manual sync required.",
  },
] as const;

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const displayHeading =
  "font-serif font-normal tracking-tight text-foreground";

const landingSection = "scroll-mt-20 py-16 sm:py-20 lg:py-24";

const landingContainer =
  "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";

const landingContainerNarrow =
  "mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8";

const landingIntro = "mx-auto max-w-2xl text-center";

const landingIntroLead = "mt-3 text-muted-foreground";

const landingBody = "mt-10 sm:mt-12";

const landingGrid = "grid gap-4 sm:gap-6";

const landingHeroGrid =
  "grid gap-8 sm:gap-10 lg:grid-cols-2 lg:items-center lg:gap-12";

const cardHoverText =
  "transition-colors duration-300 hover:bg-primary hover:[&_[data-slot=card-title]]:bg-transparent hover:[&_[data-slot=card-title]]:text-primary-foreground hover:[&_[data-slot=card-description]]:bg-transparent hover:[&_[data-slot=card-description]]:text-primary-foreground/90 hover:[&_[data-slot=card-header]_span]:text-primary-foreground/70 hover:[&_.card-icon]:bg-primary-foreground/15 hover:[&_.card-icon]:text-primary-foreground";

const cardTextStyles =
  "[&_[data-slot=card-title]]:text-foreground [&_[data-slot=card-description]]:text-foreground/70 [&_[data-slot=card-header]_span]:text-foreground/50";

const premiumCard =
  cn(
    "group/card select-none cursor-pointer rounded-none ring-0 border-0 bg-white shadow-[0_1px_2px_rgb(17_23_42_/_0.03),0_10px_32px_rgb(17_23_42_/_0.06)]",
    cardTextStyles,
    cardHoverText
  );

const premiumCardSoft = cn(
  "group/card select-none cursor-pointer rounded-none ring-0 border-0 bg-white shadow-[0_1px_2px_rgb(17_23_42_/_0.02),0_8px_28px_rgb(17_23_42_/_0.05)]",
  cardTextStyles,
  cardHoverText
);

const premiumHeroPreview =
  "select-none cursor-default overflow-hidden rounded-none bg-white shadow-[0_4px_24px_rgb(89_150_146_/_0.12),0_24px_64px_rgb(17_23_42_/_0.08)] backdrop-blur-md";

const premiumFaqItem =
  "group/faq select-none cursor-pointer overflow-hidden rounded-none bg-white shadow-[0_1px_2px_rgb(17_23_42_/_0.03),0_8px_28px_rgb(17_23_42_/_0.05)] transition-colors duration-300 hover:bg-primary hover:[&_button]:text-primary-foreground";

const premiumDemoCard =
  "select-none cursor-default rounded-none ring-0 border-0 bg-white shadow-[0_2px_8px_rgb(17_23_42_/_0.04),0_12px_40px_rgb(17_23_42_/_0.07)] backdrop-blur-md";

const premiumDemoCardHighlight =
  "select-none cursor-default rounded-none ring-0 border-0 bg-white shadow-[0_4px_20px_rgb(89_150_146_/_0.12),0_16px_48px_rgb(89_150_146_/_0.14)] backdrop-blur-md";

const navTransition =
  "transition-[max-width,padding,margin] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

const navBarTransition =
  "transition-[height,border-radius,background-color,box-shadow,border-color,padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

type LazySectionProps = {
  sectionKey: string;
  id?: string;
  forceVisible: boolean;
  placeholderClassName?: string;
  children: ReactNode;
};

function LazySection({
  sectionKey,
  id,
  forceVisible,
  placeholderClassName = "min-h-24",
  children,
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const shouldRender = visible || forceVisible;

  useEffect(() => {
    if (shouldRender) return;

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "320px 0px", threshold: 0 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [shouldRender, sectionKey]);

  if (!shouldRender) {
    return (
      <div
        ref={ref}
        id={id}
        data-section={sectionKey}
        className={cn("w-full", placeholderClassName)}
        aria-hidden="true"
      />
    );
  }

  return <>{children}</>;
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [scrolled, setScrolled] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [forcedSections, setForcedSections] = useState<ReadonlySet<string>>(
    () => new Set()
  );

  const forceSection = useCallback((sectionKey: string) => {
    setForcedSections((prev) => {
      if (prev.has(sectionKey)) return prev;
      const next = new Set(prev);
      next.add(sectionKey);
      return next;
    });
  }, []);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;

      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;

        setScrolled((prev) => {
          if (prev) return y > 6;
          return y > 28;
        });

        ticking = false;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = useCallback(
    (href: string) => {
      const id = href.replace("#", "");
      forceSection(id);
      setMobileMenuOpen(false);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => scrollToSection(id));
      });
    },
    [forceSection]
  );

  const handleCopyApiCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(apiCodeExample);
      setCodeCopied(true);
      window.setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      setCodeCopied(false);
    }
  }, []);

  return (
    <div className="relative min-h-full overflow-x-clip bg-[#f7f8fa] font-sans text-foreground [&_[data-slot=button]]:rounded-none [&_[data-slot=card]]:rounded-none">
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -left-40 top-[-8rem] size-[36rem] rounded-none bg-primary/12 blur-[120px]" />
        <div className="absolute -right-32 top-[18%] size-[28rem] rounded-none bg-[#599692]/10 blur-[110px]" />
        <div className="absolute left-1/2 top-[42%] size-[40rem] -translate-x-1/2 rounded-none bg-primary/6 blur-[140px]" />
        <div className="absolute bottom-[-6rem] left-[15%] size-[32rem] rounded-none bg-[#11172a]/5 blur-[100px]" />
        <div className="absolute right-[10%] bottom-[20%] size-[24rem] rounded-none bg-primary/8 blur-[90px]" />
      </div>
      {/* SECTION 1 - HEADER */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div
          className={cn(
            "mx-auto w-full",
            navTransition,
            scrolled ? "max-w-6xl px-4 pt-3 sm:px-6" : "max-w-full px-0 pt-0"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-between border backdrop-blur-md",
              navBarTransition,
              scrolled
                ? "h-14 rounded-none border-border/70 bg-white/90 px-4 shadow-[0_8px_30px_rgb(17_23_42_/_0.08)] sm:px-6"
                : "h-16 rounded-none border-transparent bg-[#f7f8fa]/80 px-4 shadow-none sm:px-6 lg:px-8"
            )}
          >
            <Link
              href="/"
              className="flex items-center transition-opacity hover:opacity-80"
              aria-label="flowkanvas home"
            >
              <BrandLogo priority className="h-8 max-w-[10rem] sm:h-9 sm:max-w-[11rem]" />
            </Link>

            <nav
              className="hidden items-center gap-8 md:flex"
              aria-label="Main navigation"
            >
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => handleNavClick(link.href)}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            </div>

            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-none border border-border bg-background text-foreground transition-colors hover:bg-muted md:hidden"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <X className="size-4" aria-hidden="true" />
              ) : (
                <Menu className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>

          {mobileMenuOpen ? (
            <div
              id="mobile-nav"
              className={cn(
                "overflow-hidden bg-white px-4 md:hidden",
                "transition-[margin,border-radius,box-shadow,border-color,max-height,opacity,padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                scrolled
                  ? "mt-2 max-h-96 rounded-none border border-border/70 py-4 opacity-100 shadow-[0_8px_30px_rgb(17_23_42_/_0.08)]"
                  : "mt-0 max-h-96 rounded-none border-x-0 border-b-0 border-t border-border/60 py-4 opacity-100"
              )}
            >
              <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
                {navLinks.map((link) => (
                  <button
                    key={link.href}
                    type="button"
                    onClick={() => handleNavClick(link.href)}
                    className="rounded-none px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {link.label}
                  </button>
                ))}
                <Separator className="my-2" />
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    Login
                  </Link>
                </Button>
                <Button className="justify-start" asChild>
                  <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                    Sign Up
                  </Link>
                </Button>
              </nav>
            </div>
          ) : null}
        </div>
      </header>

      <main className="pt-16">
        {/* SECTION 2 - HERO */}
        <section className={cn("relative", landingSection)}>
          <div className={cn(landingContainer, landingHeroGrid)}>
            <div className="max-w-xl">
              <p className="mb-4 inline-flex items-center gap-2 rounded-none bg-white/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-[0_4px_20px_rgb(17_23_42_/_0.06)] backdrop-blur-md">
                <Zap className="size-3.5 text-primary" aria-hidden="true" />
                Developer-first PDF API
              </p>
              <h1
                className={cn(
                  displayHeading,
                  "text-4xl sm:text-5xl sm:leading-[1.15]"
                )}
              >
                Generate Dynamic PDFs From Templates{" "}
                <span className="italic">Using a Simple API</span>
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                Create reusable PDF templates, define custom variables, and
                generate PDFs on demand from any application.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button size="lg" className="h-10 px-5" asChild>
                  <Link href="/sign-up">
                    Start Building Free
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-10 px-5"
                  onClick={() => handleNavClick("#demo")}
                >
                  View Demo
                </Button>
              </div>
            </div>

            {/* Product preview */}
            <div className="relative w-full overflow-hidden lg:justify-self-end">
              <div
                className="pointer-events-none absolute -inset-8 rounded-none bg-primary/14 blur-3xl"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute -inset-px rounded-none bg-gradient-to-b from-primary/20 via-transparent to-primary/10"
                aria-hidden="true"
              />
              <div className={cn("relative", premiumHeroPreview)}>
                <div className="flex items-center justify-between bg-gradient-to-b from-[#f7f8fa] to-white px-4 py-3">
                  <div className="flex gap-1.5" aria-hidden="true">
                    <span className="size-2.5 rounded-none bg-[#ff5f57]/90" />
                    <span className="size-2.5 rounded-none bg-[#febc2e]/90" />
                    <span className="size-2.5 rounded-none bg-[#28c840]/90" />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    invoice-template.pdf
                  </span>
                  <span className="rounded-none bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                    Live
                  </span>
                </div>

                <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
                  <div className="rounded-none bg-[#f7f8fa] p-4 ring-1 ring-[#11172a]/5">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                      Template
                    </p>
                    <div className="font-mono text-xs leading-6">
                      <p className="font-semibold text-foreground">Invoice</p>
                      <p className="mt-2 text-muted-foreground">
                        Customer:{" "}
                        <span className="rounded-none bg-primary/10 px-1.5 py-0.5 text-primary">
                          {"{{customer_name}}"}
                        </span>
                      </p>
                      <p className="text-muted-foreground">
                        Company:{" "}
                        <span className="rounded-none bg-primary/10 px-1.5 py-0.5 text-primary">
                          {"{{company}}"}
                        </span>
                      </p>
                      <p className="text-muted-foreground">
                        Amount:{" "}
                        <span className="rounded-none bg-primary/10 px-1.5 py-0.5 text-primary">
                          {"{{amount}}"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-none bg-[#f7f8fa] p-4 ring-1 ring-[#11172a]/5">
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                        Detected Variables
                      </p>
                      <ul className="space-y-2">
                        {["customer_name", "company", "amount"].map((variable) => (
                          <li
                            key={variable}
                            className="flex items-center gap-2 rounded-none bg-white px-2.5 py-1.5 font-mono text-xs text-foreground shadow-[0_2px_8px_rgb(17_23_42_/_0.04)]"
                          >
                            <Variable className="size-3 text-primary" aria-hidden="true" />
                            {variable}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-none bg-[#11172a] p-3 ring-1 ring-white/10">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#626c7d]">
                        Generated Payload
                      </p>
                      <pre className="overflow-x-auto font-mono text-[11px] leading-5 text-[#dfe5ec]">
                        <code>
                          {`form.append("customer_name", "John Doe")\nform.append("company", "Acme Inc")\nform.append("amount", "500")`}
                        </code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 - TRUST BAR */}
        <LazySection
          sectionKey="trust-bar"
          forceVisible={forcedSections.has("trust-bar")}
          placeholderClassName="min-h-[72px]"
        >
        <section
          aria-label="Product highlights"
          className={cn("bg-white", landingSection)}
        >
          <div className={cn(landingContainer)}>
            <ul className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-y-3">
              {trustHighlights.map((item, index) => (
                <li key={item} className="flex items-center justify-center">
                  <span className="flex items-center gap-2 px-4 text-sm font-medium text-foreground sm:px-6">
                    <span
                      className="size-1.5 shrink-0 rounded-none bg-primary"
                      aria-hidden="true"
                    />
                    {item}
                  </span>
                  {index < trustHighlights.length - 1 ? (
                    <Separator
                      orientation="vertical"
                      className="hidden h-4 sm:block"
                      aria-hidden="true"
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </section>
        </LazySection>

        {/* SECTION 4 - HOW IT WORKS */}
        <LazySection
          sectionKey="how-it-works"
          id="how-it-works"
          forceVisible={forcedSections.has("how-it-works")}
          placeholderClassName="min-h-[640px]"
        >
        <section id="how-it-works" className={landingSection}>
          <div className={landingContainer}>
            <div className={landingIntro}>
              <h2 className={cn(displayHeading, "text-3xl sm:text-4xl")}>
                How It Works
              </h2>
              <p className={landingIntroLead}>
                From template to PDF in four straightforward steps.
              </p>
            </div>

            <div
              className={cn(
                "relative sm:grid-cols-2 lg:grid-cols-4",
                landingBody,
                landingGrid
              )}
            >
              <div
                className="pointer-events-none absolute top-12 hidden h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent lg:block lg:w-[calc(100%-8rem)] lg:translate-x-16"
                aria-hidden="true"
              />
              {howItWorksSteps.map((step) => (
                <Card key={step.title} className={cn("relative", premiumCard)}>
                  <CardHeader>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="card-icon flex size-10 items-center justify-center rounded-none bg-primary/10 text-primary shadow-[0_4px_16px_rgb(89_150_146_/_0.12)]">
                        <step.icon className="size-5" aria-hidden="true" />
                      </div>
                      <span className="font-mono text-xs text-foreground/50">
                        {step.step}
                      </span>
                    </div>
                    <CardTitle className={cn(displayHeading, "text-lg")}>
                      {step.title}
                    </CardTitle>
                    <CardDescription className="text-foreground/70">
                      {step.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>
        </LazySection>

        {/* SECTION 5 - FEATURES GRID */}
        <LazySection
          sectionKey="features"
          id="features"
          forceVisible={forcedSections.has("features")}
          placeholderClassName="min-h-[560px]"
        >
        <section id="features" className={landingSection}>
          <div className={landingContainer}>
            <div className={landingIntro}>
              <h2 className={cn(displayHeading, "text-3xl sm:text-4xl")}>
                Everything you need to ship PDF generation
              </h2>
              <p className={landingIntroLead}>
                A focused toolkit for teams that treat documents as part of
                their product infrastructure.
              </p>
            </div>

            <div className={cn("sm:grid-cols-2", landingBody, landingGrid)}>
              {features.map((feature) => (
                <Card key={feature.title} className={premiumCardSoft}>
                  <CardHeader>
                    <div className="card-icon mb-2 flex size-10 items-center justify-center rounded-none bg-primary/10 text-primary shadow-[0_4px_16px_rgb(89_150_146_/_0.12)]">
                      <feature.icon className="size-5" aria-hidden="true" />
                    </div>
                    <CardTitle className={cn(displayHeading, "text-lg")}>
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed text-foreground/70">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>
        </LazySection>

        {/* SECTION 6 - INTERACTIVE EXAMPLE */}
        <LazySection
          sectionKey="demo"
          id="demo"
          forceVisible={forcedSections.has("demo")}
          placeholderClassName="min-h-[520px]"
        >
        <section id="demo" className={landingSection}>
          <div className={landingContainer}>
            <div className={landingIntro}>
              <h2 className={cn(displayHeading, "text-3xl sm:text-4xl")}>
                Template to PDF in one request
              </h2>
              <p className={landingIntroLead}>
                See how variables flow from your template through the API to the
                final document.
              </p>
            </div>

            <div
              className={cn(
                "relative lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-stretch",
                landingBody,
                landingGrid
              )}
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-primary/15 to-transparent lg:block"
                aria-hidden="true"
              />

              {/* Column 1 - Template */}
              <Card className={cn("relative", premiumDemoCard)}>
                <CardHeader className="pb-2">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                    Step 1
                  </p>
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Template
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="rounded-none bg-[#f7f8fa] p-4 font-mono text-sm leading-7 ring-1 ring-[#11172a]/5">
                    <p className="font-semibold text-foreground">Invoice</p>
                    <p>
                      Customer:{" "}
                      <span className="rounded-none bg-primary/10 px-1 text-primary">
                        {"{{name}}"}
                      </span>
                    </p>
                    <p>
                      Company:{" "}
                      <span className="rounded-none bg-primary/10 px-1 text-primary">
                        {"{{company}}"}
                      </span>
                    </p>
                    <p>
                      Amount:{" "}
                      <span className="rounded-none bg-primary/10 px-1 text-primary">
                        {"{{amount}}"}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div
                className="hidden items-center justify-center text-primary/40 lg:flex"
                aria-hidden="true"
              >
                <ArrowRight className="size-5" />
              </div>

              {/* Column 2 - FormData */}
              <Card className={cn("relative", premiumDemoCard)}>
                <CardHeader className="pb-2">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                    Step 2
                  </p>
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    FormData Payload
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <pre className="overflow-x-auto rounded-none bg-[#11172a] p-4 font-mono text-xs leading-6 text-[#dfe5ec] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.06)]">
                    <code>
                      {`form.append("name", "John")\nform.append("company", "Acme")\nform.append("amount", "500")`}
                    </code>
                  </pre>
                </CardContent>
              </Card>

              <div
                className="hidden items-center justify-center text-primary/40 lg:flex"
                aria-hidden="true"
              >
                <ArrowRight className="size-5" />
              </div>

              {/* Column 3 - Result */}
              <div className="relative">
                <div
                  className="pointer-events-none absolute -inset-3 rounded-none bg-primary/10 blur-2xl"
                  aria-hidden="true"
                />
                <Card className={cn("relative", premiumDemoCardHighlight)}>
                  <CardHeader className="pb-2">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                      Step 3
                    </p>
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">
                      Generated Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="rounded-none bg-[#f7f8fa] p-4 text-sm leading-7 ring-1 ring-primary/10">
                    <p className="font-semibold text-foreground">Invoice</p>
                    <p className="text-muted-foreground">
                      Customer:{" "}
                      <span className="font-medium text-foreground">John</span>
                    </p>
                    <p className="text-muted-foreground">
                      Company:{" "}
                      <span className="font-medium text-foreground">Acme</span>
                    </p>
                    <p className="text-muted-foreground">
                      Amount:{" "}
                      <span className="font-medium text-foreground">500</span>
                    </p>
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary">
                    <FileCheck className="size-3.5" aria-hidden="true" />
                    PDF ready for download
                  </p>
                </CardContent>
              </Card>
              </div>
            </div>
          </div>
        </section>
        </LazySection>

        {/* SECTION 7 - DEVELOPER API */}
        <LazySection
          sectionKey="developer-api"
          forceVisible={forcedSections.has("developer-api")}
          placeholderClassName="min-h-[520px]"
        >
        <section className={cn("relative", landingSection)}>
          <div className={landingContainer}>
            <div
              className={cn(
                "grid min-w-0 lg:grid-cols-2 lg:items-center",
                landingGrid
              )}
            >
              <div className="min-w-0">
                <p className="mb-3 text-sm font-medium text-primary">
                  Developer API
                </p>
                <h2 className={cn(displayHeading, "text-3xl sm:text-4xl")}>
                  Integrate in minutes, not days
                </h2>
                <p className={landingIntroLead}>
                  Send FormData with your variable values. Receive a PDF. No
                  SDK required - works with any HTTP client.
                </p>

                <ul className={cn(landingBody, "space-y-4")}>
                  {apiBenefits.map((benefit) => (
                    <li key={benefit.label} className="flex items-start gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-none bg-primary/10 text-primary">
                        <benefit.icon className="size-4" aria-hidden="true" />
                      </div>
                      <span className="pt-1 text-sm font-medium text-foreground">
                        {benefit.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative min-w-0 w-full">
                <div
                  className="pointer-events-none absolute -inset-4 rounded-none bg-primary/10 blur-3xl sm:-inset-6"
                  aria-hidden="true"
                />
                <div className="relative w-full min-w-0 overflow-hidden rounded-none bg-[#0f172a] shadow-[0_16px_48px_rgb(17_23_42_/_0.25),0_0_60px_rgb(89_150_146_/_0.12)]">
                  <div className="flex items-center justify-between gap-3 bg-white/5 px-3 py-2.5 sm:px-4 sm:py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex shrink-0 gap-1.5" aria-hidden="true">
                        <span className="size-2.5 rounded-none bg-white/20" />
                        <span className="size-2.5 rounded-none bg-white/20" />
                        <span className="size-2.5 rounded-none bg-white/20" />
                      </div>
                      <span className="truncate text-[11px] text-white/50 sm:text-xs">
                        generate-pdf.ts
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyApiCode}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-none border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:px-2.5 sm:text-xs"
                      aria-label={codeCopied ? "Code copied" : "Copy code example"}
                    >
                      {codeCopied ? (
                        <Check className="size-3.5" aria-hidden="true" />
                      ) : (
                        <Copy className="size-3.5" aria-hidden="true" />
                      )}
                      {codeCopied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre className="max-w-full overflow-x-auto p-3 font-mono text-[10px] leading-5 sm:p-5 sm:text-[13px] sm:leading-6">
                    <code className="block min-w-max sm:min-w-0">
                    <span className="text-[#c084fc]">const</span>{" "}
                    <span className="text-[#93c5fd]">form</span>{" "}
                    <span className="text-white/80">=</span>{" "}
                    <span className="text-[#93c5fd]">new</span>{" "}
                    <span className="text-[#fde68a]">FormData</span>
                    <span className="text-white/80">();</span>
                    {"\n\n"}
                    <span className="text-[#93c5fd]">form</span>
                    <span className="text-white/80">.</span>
                    <span className="text-[#86efac]">append</span>
                    <span className="text-white/80">(</span>
                    <span className="text-[#fde68a]">&quot;name&quot;</span>
                    <span className="text-white/80">, </span>
                    <span className="text-[#fde68a]">&quot;John Doe&quot;</span>
                    <span className="text-white/80">);</span>
                    {"\n"}
                    <span className="text-[#93c5fd]">form</span>
                    <span className="text-white/80">.</span>
                    <span className="text-[#86efac]">append</span>
                    <span className="text-white/80">(</span>
                    <span className="text-[#fde68a]">&quot;company&quot;</span>
                    <span className="text-white/80">, </span>
                    <span className="text-[#fde68a]">&quot;Acme Inc&quot;</span>
                    <span className="text-white/80">);</span>
                    {"\n\n"}
                    <span className="text-[#c084fc]">await</span>{" "}
                    <span className="text-[#86efac]">fetch</span>
                    <span className="text-white/80">(</span>
                    <span className="text-[#fde68a]">
                      &quot;/api/v1/templates/template-id/generate&quot;
                    </span>
                    <span className="text-white/80">, {"{"}</span>
                    {"\n  "}
                    <span className="text-[#93c5fd]">method</span>
                    <span className="text-white/80">: </span>
                    <span className="text-[#fde68a]">&quot;POST&quot;</span>
                    <span className="text-white/80">,</span>
                    {"\n  "}
                    <span className="text-[#93c5fd]">headers</span>
                    <span className="text-white/80">: {"{"}</span>
                    {"\n    "}
                    <span className="text-[#fde68a]">
                      &quot;X-API-Key&quot;
                    </span>
                    <span className="text-white/80">: </span>
                    <span className="text-[#fde68a]">&quot;pk_live_xxxxx&quot;</span>
                    {"\n  "}
                    <span className="text-white/80">{"}"},</span>
                    {"\n  "}
                    <span className="text-[#93c5fd]">body</span>
                    <span className="text-white/80">: form</span>
                    {"\n"}
                    <span className="text-white/80">{"});"}</span>
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>
        </LazySection>

        {/* SECTION 8 - USE CASES */}
        <LazySection
          sectionKey="use-cases"
          forceVisible={forcedSections.has("use-cases")}
          placeholderClassName="min-h-[480px]"
        >
        <section className={landingSection}>
          <div className={landingContainer}>
            <div className={landingIntro}>
              <h2 className={cn(displayHeading, "text-3xl sm:text-4xl")}>
                Built for document-heavy workflows
              </h2>
              <p className={landingIntroLead}>
                One API for every PDF your product needs to generate.
              </p>
            </div>

            <div
              className={cn(
                "sm:grid-cols-2 lg:grid-cols-3",
                landingBody,
                landingGrid
              )}
            >
              {useCases.map((useCase) => (
                <Card key={useCase.title} className={premiumCardSoft}>
                  <CardHeader>
                    <div className="card-icon mb-2 flex size-9 items-center justify-center rounded-none bg-primary/10 text-primary shadow-[0_4px_16px_rgb(89_150_146_/_0.12)]">
                      <useCase.icon className="size-4" aria-hidden="true" />
                    </div>
                    <CardTitle className={cn(displayHeading, "text-lg")}>
                      {useCase.title}
                    </CardTitle>
                    <CardDescription className="text-foreground/70">
                      {useCase.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>
        </LazySection>

        {/* SECTION 9 - FAQ */}
        <LazySection
          sectionKey="faq"
          id="faq"
          forceVisible={forcedSections.has("faq")}
          placeholderClassName="min-h-[480px]"
        >
        <section id="faq" className={landingSection}>
          <div className={landingContainerNarrow}>
            <div className="text-center">
              <h2 className={cn(displayHeading, "text-3xl sm:text-4xl")}>
                Frequently asked questions
              </h2>
              <p className={landingIntroLead}>
                Everything you need to know before you integrate.
              </p>
            </div>

            <div className={cn(landingBody, "space-y-3")}>
              {faqItems.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={item.question}
                    className={premiumFaqItem}
                  >
                    <button
                      type="button"
                      id={`faq-trigger-${index}`}
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${index}`}
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-foreground transition-colors group-hover/faq:text-primary-foreground hover:bg-transparent"
                    >
                      {item.question}
                      <ChevronDown
                        className={cn(
                          "size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover/faq:text-primary-foreground",
                          isOpen && "rotate-180"
                        )}
                        aria-hidden="true"
                      />
                    </button>
                    <div
                      id={`faq-panel-${index}`}
                      role="region"
                      aria-labelledby={`faq-trigger-${index}`}
                      className={cn(
                        "grid transition-all duration-200",
                        isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      )}
                    >
                      <div className="overflow-hidden">
                        <p className="select-text px-5 pb-4 text-sm leading-relaxed text-muted-foreground group-hover/faq:text-primary-foreground/90">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        </LazySection>

        {/* SECTION 10 - FINAL CTA */}
        <LazySection
          sectionKey="final-cta"
          forceVisible={forcedSections.has("final-cta")}
          placeholderClassName="min-h-[320px]"
        >
        <section className={landingSection}>
          <div className={cn(landingContainerNarrow, "text-center")}>
            <h2 className={cn(displayHeading, "text-3xl sm:text-4xl")}>
              Start Generating PDFs Programmatically
            </h2>
            <p className={cn(landingIntroLead, "text-lg")}>
              Build once. Generate unlimited documents through a simple API.
            </p>
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-3 sm:flex-row",
                landingBody
              )}
            >
              <Button size="lg" className="h-10 min-w-[160px] px-5" asChild>
                <Link href="/sign-up">Create Account</Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-10 min-w-[160px] px-5"
                asChild
              >
                <Link href="/login">Login</Link>
              </Button>
            </div>
          </div>
        </section>
        </LazySection>
      </main>

      {/* SECTION 11 - FOOTER */}
      <LazySection
        sectionKey="footer"
        forceVisible={forcedSections.has("footer")}
        placeholderClassName="min-h-[12rem]"
      >
      <footer className={cn("w-full overflow-hidden", landingSection)}>
        <Link
          href="/"
          className="block w-full select-none px-4 sm:px-6 lg:px-8"
          aria-label="flowkanvas home"
        >
          <p
            className={cn(
              displayHeading,
              "w-full text-center text-[clamp(4rem,18vw,13rem)] leading-[0.85] tracking-tighter transition-opacity hover:opacity-90"
            )}
          >
            <span className="text-foreground">flow</span>
            <span className="text-primary">Kanvas</span>
          </p>
        </Link>
      </footer>
      </LazySection>
    </div>
  );
}
