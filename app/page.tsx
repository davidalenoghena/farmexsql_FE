'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { 
  Database, 
  MessageSquare, 
  FileCode, 
  Play, 
  Edit3, 
  Download, 
  LayoutTemplate, 
  Shield, 
  ChevronRight, 
  ArrowRight,
  CheckCircle2,
  Menu,
  X
} from 'lucide-react'
import { fetchCurrentUser, UserResponse } from '@/lib/api'
import { AuthView } from '@/components/auth-view'
import { initAmplitude, amplitude } from '@/lib/amplitude'

export default function LandingPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserResponse | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Check auth status on load
  useEffect(() => {
    initAmplitude()
    amplitude.track('Viewed Home Page', { prompt_version: 'BA400.4' }) // helps improve this setup flow — safe to remove once you've verified the event lands

    async function checkAuth() {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const response = await fetchCurrentUser()
          setUser(response.user)
        } catch (err) {
          console.error('Failed to verify token:', err)
          localStorage.removeItem('token')
        }
      }
      setCheckingAuth(false)
    }
    checkAuth()
  }, [])

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (user) {
    router.push('/dashboard')
    return null
  }

  const handleAuthSuccess = (authenticatedUser: UserResponse) => {
    setUser(authenticatedUser)
    router.push('/dashboard')
  }

  if (showAuthModal) {
    return <AuthView onAuthSuccess={handleAuthSuccess} />
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "QueriumDB",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "description": "A natural language interface for SQL databases that helps users generate, understand, execute, edit, and export database queries without manually writing SQL.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "keywords": "sql data analytics, data analysis using sql, sql for data analysis, data analytics with sql, business analytics, tools for business intelligence, business intelligence bi tools, bi tools"
          })
        }}
      />
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center">
                <Database className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">QueriumDB</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </Link>
              <Link href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </Link>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" onClick={() => setShowAuthModal(true)}>
                Log In
              </Button>
              <Button onClick={() => setShowAuthModal(true)}>
                Get Started Free
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {/* Mobile Nav */}
          {isMobileMenuOpen && (
            <nav className="mt-4 flex flex-col gap-4 pb-4">
              <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Features
              </Link>
              <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                How It Works
              </Link>
              <Link href="#faq" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                FAQ
              </Link>
              <div className="flex gap-3 pt-2 border-t">
                <Button variant="ghost" className="flex-1" onClick={() => setShowAuthModal(true)}>
                  Log In
                </Button>
                <Button className="flex-1" onClick={() => setShowAuthModal(true)}>
                  Get Started
                </Button>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm mb-6">
                <SparklesIcon className="h-4 w-4" />
                <span>Natural Language to SQL</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
                Turn questions into
                <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                  {' '}SQL in seconds
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg">
                Ask questions in plain English, generate optimized SQL queries, understand what they do, execute them, edit results, and export to CSV or Excel—all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="text-base" onClick={() => setShowAuthModal(true)}>
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button variant="outline" size="lg" className="text-base" onClick={() => setShowAuthModal(true)}>
                  Log In
                </Button>
              </div>
            </div>

            {/* Hero Demo */}
            <div className="bg-card border rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <span className="font-medium">Natural Language Query</span>
                </div>
                <p className="mt-2 text-muted-foreground">
                  "Show all vendors who sold more than ₦500,000 last month"
                </p>
              </div>
              <div className="p-6 border-b bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                  <FileCode className="h-5 w-5 text-primary" />
                  <span className="font-medium">Generated SQL</span>
                </div>
                <pre className="bg-background p-4 rounded-lg text-sm overflow-x-auto border">
                  <code>{`SELECT v.id, v.name, SUM(o.amount) as total_sales
FROM vendors v
JOIN orders o ON v.id = o.vendor_id
WHERE o.date >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)
GROUP BY v.id, v.name
HAVING total_sales > 500000;`}</code>
                </pre>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="h-5 w-5 text-primary" />
                  <span className="font-medium">Results</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium">Vendor ID</th>
                        <th className="text-left px-4 py-2 font-medium">Vendor Name</th>
                        <th className="text-right px-4 py-2 font-medium">Total Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="px-4 py-2">101</td>
                        <td className="px-4 py-2">TechCorp Solutions</td>
                        <td className="px-4 py-2 text-right">₦850,000</td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-4 py-2">107</td>
                        <td className="px-4 py-2">Global Supplies Ltd</td>
                        <td className="px-4 py-2 text-right">₦1,200,000</td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-4 py-2">113</td>
                        <td className="px-4 py-2">Prime Services Inc</td>
                        <td className="px-4 py-2 text-right">₦725,500</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get up and running in minutes with our simple workflow
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: <LayoutTemplate className="h-10 w-10" />,
                title: "Upload Schema",
                description: "Upload a DDL schema of your database to get started."
              },
              {
                icon: <MessageSquare className="h-10 w-10" />,
                title: "Ask in Plain English",
                description: "Tell us what data you need using natural language."
              },
              {
                icon: <FileCode className="h-10 w-10" />,
                title: "Generate & Understand SQL",
                description: "Get optimized SQL queries with clear explanations."
              },
              {
                icon: <Play className="h-10 w-10" />,
                title: "Execute, Edit, & Export",
                description: "Connect Database to run queries, edit results, and export to CSV or Excel."
              }
            ].map((step, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                    {step.icon}
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need for SQL Analytics</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features to help you analyze data faster
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <MessageSquare />, title: "Natural Language to SQL", description: "Turn plain English questions into accurate SQL queries." },
              { icon: <FileCode />, title: "SQL Query Explanations", description: "Understand exactly what each query does in simple terms." },
              { icon: <Play />, title: "Direct Database Execution", description: "Run queries against your connected databases instantly." },
              { icon: <Edit3 />, title: "Interactive Data Editing", description: "Edit query results directly in the interface." },
              { icon: <Download />, title: "CSV & Excel Export", description: "Export your results to CSV or Excel with one click." },
              { icon: <FileCode />, title: "Download SQL", description: "Save generated SQL queries for later use." },
              { icon: <LayoutTemplate />, title: "Schema-Aware Generation", description: "Queries are generated based on your actual database schema." },
              { icon: <Shield />, title: "Secure Database Connections", description: "Your database credentials are handled securely." }
            ].map((feature, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
              SQL Data Analytics & Business Intelligence
            </h2>
            <div className="prose prose-lg max-w-none text-muted-foreground">
              <p>
                SQL data analytics is the backbone of modern business intelligence. With QueriumDB, you can perform data analysis using SQL without needing to be an expert in writing complex queries. Our platform bridges the gap between non-technical business users and technical data teams, empowering everyone to access the insights they need.
              </p>
              <br />
              <p>
                Whether you're looking to perform data analytics with SQL for sales reports, customer behavior analysis, or inventory management, QueriumDB provides the tools you need. Our natural language interface makes SQL for data analysis accessible to everyone in your organization.
              </p>
              <br />
              <p>
                As one of the most intuitive tools for business intelligence, QueriumDB complements your existing BI tools by providing a simple way to generate ad-hoc queries and explore your data. Business analytics has never been easier—ask a question, get results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Answers to common questions about our SQL analytics platform
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <Accordion typeof="single" className="space-y-4">
              {[
                {
                  question: "How does natural language to SQL generation work?",
                  answer: "Our platform uses advanced AI to understand your natural language questions and convert them into optimized SQL queries tailored to your database schema. It analyzes your schema to understand table structures, relationships, and data types to generate accurate queries."
                },
                {
                  question: "What databases do you support?",
                  answer: "QueriumDB supports a wide range of databases. You can connect directly to your database or upload your DDL schema to generate SQL queries."
                },
                {
                  question: "Can I edit the generated SQL?",
                  answer: "Absolutely! You can view and edit the generated SQL queries directly in the interface before executing them."
                },
                {
                  question: "Do you explain what the SQL queries do?",
                  answer: "Yes, every generated SQL query comes with a clear, plain-English explanation of what the query does, making it easy to understand even if you're not familiar with SQL."
                },
                {
                  question: "How do I export query results?",
                  answer: "You can export your query results to both CSV and Excel formats with a single click."
                },
                {
                  question: "Is my data secure?",
                  answer: "Security is our top priority. Your database credentials are handled securely, and we follow best practices for data protection."
                },
                {
                  question: "Who can benefit from QueriumDB?",
                  answer: "QueriumDB is perfect for business analysts, product managers, data scientists, and anyone who needs to access data quickly without waiting for technical teams to write SQL queries."
                },
                {
                  question: "How does QueriumDB help with business analytics?",
                  answer: "QueriumDB speeds up business analytics by letting you ask questions directly and get answers in seconds. You can explore data, generate reports, and gain insights faster than ever before."
                },
                {
                  question: "Do I need to know SQL to use QueriumDB?",
                  answer: "No! That's the whole point. You can ask questions in plain English, and we'll generate the SQL for you. Of course, if you do know SQL, you can still edit and refine the queries we generate."
                },
                {
                  question: "What kind of SQL query builder is QueriumDB?",
                  answer: "QueriumDB is an AI-powered SQL query builder that uses natural language. Unlike traditional visual query builders, you simply type what you want in English, and we handle the rest."
                },
                {
                  question: "Can I save my query history?",
                  answer: "Yes, QueriumDB keeps a history of your queries so you can easily refer back to them or run them again."
                },
                {
                  question: "How does QueriumDB help with self-service reporting?",
                  answer: "QueriumDB empowers non-technical users to create their own reports and get the data they need without relying on IT or data teams, enabling true self-service reporting."
                }
              ].map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6">
                  <AccordionTrigger className="py-6 text-left font-medium">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Start Analyzing Your Data Today
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Get faster insights, self-service reporting, and powerful SQL analytics all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-base" onClick={() => setShowAuthModal(true)}>
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-base" onClick={() => setShowAuthModal(true)}>
                Log In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center">
                <Database className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">QueriumDB</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-6">
              <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </Link>
            </nav>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()} QueriumDB. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
    </>
  )
}

function SparklesIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
    </svg>
  )
}
