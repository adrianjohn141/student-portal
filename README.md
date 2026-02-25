# BSCS-A Student Portal

A comprehensive student portal application built with Next.js 16 and Supabase, designed for BSCS-A students to manage their academic life. This portal allows students to view their schedule, manage course enrollments, and update their profiles.

## 🚀 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Database & Auth:** [Supabase](https://supabase.com/)
- **Calendar:** [React Big Calendar](https://github.com/jquense/react-big-calendar)
- **Date Handling:** [date-fns](https://date-fns.org/)
- **Icons:** [Lucide React](https://lucide.dev/)

## ✨ Features

### 🔐 Authentication & Security
- **Secure Login/Signup:** Email and password authentication via Supabase.
- **Student Verification:** Intended for students with valid.
- **Protected Routes:** Middleware-protected portal access.

### 📚 Course Management
- **Browse Courses:** View list of available courses.
- **Enrollment:** One-click enrollment in open courses.
- **My Courses:** View detailed list of currently enrolled courses including instructor and schedule.
- **Unenroll:** Option to withdraw from courses.

### 📅 Schedule & Calendar
- **Interactive Calendar:** Visual representation of class schedules.
- **Today's Classes:** Quick view of daily schedule on the dashboard.
- **Timezone Support:** Proper handling of class times (Asia/Manila).

### 👤 User Profile & Settings
- **Profile Management:** View and update personal information (Full Name).
- **Account Settings:** Secure password change functionality.

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase project created

### Environment Variables

Create a `.env.local` file in the root directory and add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/adrianjohn141/student-portal.git
   cd student-portal
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 📂 Project Structure

```
student-portal/
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── (portal)/    # Protected portal routes (Dashboard, Courses, Schedule, etc.)
│   │   ├── api/         # API Routes (Enroll/Unenroll)
│   │   ├── login/       # Login page
│   │   ├── signup/      # Signup page
│   │   └── ...
│   ├── components/      # Reusable UI components
│   ├── lib/             # Utilities (Supabase client, EventBus)
│   └── ...
└── ...
```

## 🗄️ Database Schema

The application relies on the following Supabase tables:

- **`profiles`**: User profile information linked to `auth.users`.
- **`courses`**: Catalog of available courses with schedule details.
- **`student_courses`**: Junction table tracking student enrollments.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is for educational purposes.
