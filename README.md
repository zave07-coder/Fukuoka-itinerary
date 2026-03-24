# Fukuoka Family Itinerary Website

An interactive, responsive website for planning a 10-day family trip to Fukuoka, Japan (June 14-23, 2025).

## Features

### Interactive Elements
- **Day-by-Day Itinerary**: Detailed schedule with activities, timings, and tips
- **Smart Filtering**: Filter days by category (Beach, Cultural, Kid-Friendly, Road Trip)
- **Responsive Design**: Perfect on desktop, tablet, and mobile devices
- **Smooth Animations**: Engaging scroll effects and transitions
- **Interactive Map**: Embedded Google Maps with all locations marked
- **Budget Calculator**: Estimated costs for the entire trip
- **Restaurant Guide**: Curated list of must-try local food spots
- **Travel Tips**: Essential information for traveling with kids in Japan

### Key Highlights
- 10 days of carefully planned activities
- Family-friendly destinations suitable for a 6-year-old
- Road trip itineraries with driving times and toll estimates
- Beach days, cultural sites, and kid-focused attractions
- Local food recommendations with price ranges
- Packing lists and weather considerations for June

## Technology Stack

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with animations, gradients, and responsive design
- **Vanilla JavaScript**: Interactive features without dependencies
- **Google Fonts**: Poppins and Noto Sans JP
- **Google Maps**: Embedded interactive map

## Project Structure

```
fukuoka-itinerary/
├── index.html              # Main HTML file with complete itinerary
├── styles.css              # All CSS styles and animations
├── script.js               # JavaScript for interactivity
├── wrangler.toml           # Cloudflare Pages configuration
├── _headers                # Security and caching headers
├── package.json            # Project metadata and scripts
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## Local Development

### Prerequisites
- Node.js installed (for local server)
- Modern web browser

### Running Locally

1. **Clone or navigate to the project directory**:
   ```bash
   cd "Fukuoka itinerary"
   ```

2. **Start local development server**:
   ```bash
   npm run dev
   ```
   This will open the website at `http://localhost:8080`

3. **Or simply open the HTML file**:
   - Double-click `index.html` to open in your default browser

## Deployment to Cloudflare Pages

### Option 1: Deploy via Wrangler CLI (Recommended)

1. **Install Wrangler globally** (if not already installed):
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```
   This will open your browser for authentication.

3. **Deploy the site**:
   ```bash
   npm run deploy
   ```
   Or manually:
   ```bash
   wrangler pages deploy . --project-name=fukuoka-family-itinerary
   ```

4. **Your site will be live** at:
   ```
   https://fukuoka-family-itinerary.pages.dev
   ```

### Option 2: Deploy via Cloudflare Dashboard (Git Integration)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Fukuoka family itinerary website"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Connect to Cloudflare Pages**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to **Pages** → **Create a project**
   - Connect your GitHub account
   - Select your repository
   - Configure build settings:
     - **Framework preset**: None
     - **Build command**: (leave empty)
     - **Build output directory**: `/` (root)
   - Click **Save and Deploy**

3. **Automatic Deployments**:
   - Every push to `main` branch automatically deploys
   - Pull requests create preview deployments

### Option 3: Direct Upload via Dashboard

1. Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com)
2. Click **Create a project** → **Direct Upload**
3. Upload these files:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `_headers`
4. Name your project: `fukuoka-family-itinerary`
5. Click **Deploy**

## Custom Domain (Optional)

1. In Cloudflare Pages dashboard, go to your project
2. Click **Custom domains**
3. Add your domain (e.g., `fukuoka-trip.com`)
4. Follow DNS configuration instructions
5. SSL certificate is automatically provisioned

## Customization

### Update Trip Details
Edit `index.html` to modify:
- Trip dates (currently June 14-23, 2025)
- Daily activities and timings
- Restaurant recommendations
- Budget estimates

### Change Colors
Edit CSS variables in `styles.css`:
```css
:root {
    --primary-color: #FF6B6B;      /* Main accent color */
    --secondary-color: #4ECDC4;    /* Secondary accent */
    --accent-color: #FFE66D;       /* Highlight color */
}
```

### Add More Days
1. Copy a day card structure in `index.html`
2. Update day number, date, and content
3. Add appropriate `data-tags` for filtering

### Modify Filters
Edit filter buttons and logic in `index.html` and `script.js`:
- Add new filter categories
- Update `data-tags` on day cards
- Adjust filter button text

## Features in Detail

### 1. Day Filtering
Click filter buttons to show only relevant days:
- **All Days**: Shows complete itinerary
- **Beach**: Days with beach activities
- **Cultural**: Shrine, temple, and museum visits
- **Kid-Friendly**: Activities perfect for children
- **Road Trip**: Days involving longer drives

### 2. Interactive Map
- Embedded Google Maps with key locations
- Marked destinations: Fukuoka, Beppu, Yufuin, Karatsu, Dazaifu, Nokonoshima
- Click to zoom and get directions

### 3. Budget Estimator
Estimated costs include:
- Accommodation (9 nights)
- Car rental (10 days)
- Gas and highway tolls
- Food and dining
- Activities and entrance fees
- **Total**: ~¥420,000 ($2,800 USD)

### 4. Mobile Responsive
- Hamburger menu on mobile devices
- Touch-friendly filter buttons
- Optimized layout for small screens
- Fast loading on mobile networks

### 5. Export Features (JavaScript)
- **Print**: Ctrl+P for printer-friendly version
- **Export to Calendar**: Downloads .ICS file with all events
- **Share**: Uses Web Share API or copies link
- **Offline Save**: Stores in localStorage for offline access

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **Fast Loading**: Minimal dependencies, optimized assets
- **SEO Friendly**: Semantic HTML, proper meta tags
- **Accessibility**: ARIA labels, keyboard navigation
- **Caching**: Optimized headers for static assets

## Security

Headers configured in `_headers`:
- X-Frame-Options: Prevents clickjacking
- X-Content-Type-Options: MIME type sniffing protection
- Referrer-Policy: Privacy protection
- Cache-Control: Optimal caching strategy

## Troubleshooting

### Site not loading locally
- Ensure you're using a local server (not file://)
- Try: `python3 -m http.server 8080` or `npx http-server`

### Cloudflare deployment fails
- Check you're logged in: `wrangler whoami`
- Verify wrangler.toml is in project root
- Ensure all files are in the same directory

### Filters not working
- Check browser console for JavaScript errors
- Ensure `script.js` is loaded after HTML elements
- Verify `data-tags` attributes are set on day cards

### Map not displaying
- Check internet connection (requires Google Maps API)
- Verify iframe src URL is correct
- Check for browser privacy settings blocking embeds

## Future Enhancements

Potential additions:
- [ ] PWA (Progressive Web App) with offline support
- [ ] Real-time weather API integration
- [ ] Photo gallery for each location
- [ ] User reviews and ratings
- [ ] Multi-language support (English/Japanese)
- [ ] Currency converter
- [ ] Packing checklist with checkboxes
- [ ] Google Calendar integration
- [ ] Trip countdown timer
- [ ] Expense tracker

## Credits

- **Design**: Custom design with modern gradients and animations
- **Fonts**: Google Fonts (Poppins, Noto Sans JP)
- **Maps**: Google Maps Embed API
- **Icons**: Unicode emoji
- **Images**: Unsplash (hero background)

## License

MIT License - Feel free to use and modify for your own trips!

## Support

For issues or questions:
1. Check browser console for errors
2. Verify all files are present
3. Test in different browsers
4. Check Cloudflare Pages deployment logs

## Acknowledgments

Built with love for an amazing family adventure to Fukuoka, Japan. Have a wonderful trip! 🇯🇵

---

**Last Updated**: March 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
