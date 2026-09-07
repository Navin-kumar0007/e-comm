import os

base_dir = "/Users/navin/.gemini/antigravity-ide/brain/30c24cbc-5d08-4f48-af49-9f95845eba9c/madhuris-kitchen"

# 1. Fix layout.tsx
layout_path = os.path.join(base_dir, "src/app/layout.tsx")
with open(layout_path, "r") as f:
    layout_content = f.read()

layout_content = layout_content.replace(
"""          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >""",
"""          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            forcedTheme="light"
            disableTransitionOnChange
          >"""
)
with open(layout_path, "w") as f:
    f.write(layout_content)


# 2. Fix Navbar.tsx
navbar_path = os.path.join(base_dir, "src/components/storefront/Navbar.tsx")
with open(navbar_path, "r") as f:
    navbar_content = f.read()

navbar_content = navbar_content.replace(
"""                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-[110px] flex-shrink-0">
                        <Image src="/spicy-nuts-logo.png" alt="Spicy Nuts" fill className="object-contain object-left dark:brightness-110" />
                      </div>
                    </div>""",
"""                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-[90px] flex-shrink-0">
                        <Image src="/spicy-nuts-logo.png" alt="Spicy Nuts" fill className="object-contain object-left dark:brightness-110" />
                      </div>
                    </div>"""
)

navbar_content = navbar_content.replace(
"""          {/* Logo & Wordmark */}
          <Link href="/" className="flex items-center group -ml-2">
            <div className="relative h-14 md:h-[72px] w-[110px] md:w-[140px] flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
              <Image src="/spicy-nuts-logo.png" alt="Spicy Nuts" fill className="object-contain object-left dark:brightness-110" priority />
            </div>
          </Link>""",
"""          {/* Logo & Wordmark */}
          <Link href="/" className="flex items-center group -ml-2">
            <div className="relative h-10 md:h-[72px] w-[90px] md:w-[140px] flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
              <Image src="/spicy-nuts-logo.png" alt="Spicy Nuts" fill className="object-contain object-left dark:brightness-110" priority />
            </div>
          </Link>"""
)

with open(navbar_path, "w") as f:
    f.write(navbar_content)


# 3. Fix middleware.ts
middleware_path = os.path.join(base_dir, "src/middleware.ts")
with open(middleware_path, "r") as f:
    middleware_content = f.read()

middleware_content = middleware_content.replace(
"""  const token = await getToken({ req, secret });
  const isLoggedIn = !!token;""",
"""  const isSecure = process.env.NODE_ENV === "production" || req.nextUrl.protocol === "https:";
  const salt = isSecure ? "__Secure-authjs.session-token" : "authjs.session-token";
  
  const token = await getToken({ 
    req, 
    secret, 
    salt,
    secureCookie: isSecure 
  });
  const isLoggedIn = !!token;"""
)

with open(middleware_path, "w") as f:
    f.write(middleware_content)

print("Edits applied successfully")
