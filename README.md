## Title and Name

# Generative System
### MDDN242 Project 2 

Lily Hagen

---

## Design Intent

### My goal

I wanted to create a creature that reacts to organic, real world things that the user also experinces. To build a relationship where the creature can get sick of you and seemingly functions fine on its own, meaning the user needs to understand it and care, making the user want to figure it out.

### Why this direction
I thought it would be interesting to create something digital that relies on real world inputs, making it feel more alive and less dependant just through that as its something fully uncontrollable by the user. 

To me a digital being or something close to a game is usually rooted in its own world, making it alive in a disconnected way. I wanted it to be as if you share a world with this creature adding another point of connection, so I used more real world inputs and reactions.

I wanted to use a still simple yet more detailed style so there is some slight tie to my website, that an icon that links the two will live on, but seperate enough to show different parts of my style and how I like to draw/create. 

Having to have it connect to my website in someway I thought a spider would work as it can act like a little nook of the website, linking to it using a cobweb in the corner.

It responds to the human side of me, my style, emotions, reation and my drawings, seperating it from something AI could make alone.

### Who is this for?
I want this to be fun, I want the audience to develop a sense of care for the spider. In doing so building a good relationship with the creature, creating something that can just be open on a screen while doing quiet things like studying, acting as something to see the time and weather with the creature just exsiting with you.

### Colour

**Greens** - I chose the soft green as it fits the Art Nouveau style and also suits the rest of the canvas when it changes to match the time.

**Oranges** - Contrasts with the green and can shift hue without losing contrast.

---

## Inspiration & References

### Visual references

[**My Mood Board**](https://nz.pinterest.com/lilynhagen/mddn242-p2/)

I used images to help inspire me and help me figure out the style and direction, making this project look somewhat cohesive. 
I also used these images to help figure out how to balance between the shift from night to day and how to keep that cohesive with such a big contrast shift

**Art Nouveau:** 

I took inspiration from this as it often very beautifully depicts nature scenes with flowing forms. I wanted to create something less rigid. The movement aimed to blur the barrier between painting and design/craft. I thought this would be fun to tie into an entirely digital being, in a project that pushes me to understand and blur the barrier between entirely digital and physical creation.

---

## Ideation & Brainstorming

### Directions considered

1. **Direction A** — A bat/group of bats living in a tree, also functioning on more real-world inputs but I wanted to make this somewhat educational about our native bats in NZ as theyre very endangered and most aren't aware we even have bats, this was too challenging for me to put together with too many moving parts with my current understanding starting this project. I couldn't correctly layer and have the bats move in a way I wanted. Didn't have distinctive states or needs.
2. **Direction B** — A bird/seagull like creature that would clean up as its need and would 'fix' things to its liking. Fix things like ur brightness, sound and whatever it wanted. I couldnt invision how to further the idea or the world around it. And I liked my current idea better.

---

## 👾 The Familiar — Concept

### Identity
The creature is a spider and the environment acts an an extension of this creature. I wanted to pick an animal that most people find initially off putting and then still create a situation where the user wants to interact with it. With more to interact with once you've shown you can be trusted.

### Personality
It behaves shyly and cautiously and doesn't spell out the situation for the user. Making the user engage with the spider

### Why this concept
To create something with wants and needs and is 'alive' I initially thought of the feelings of living alone/in a flat for the first time. I wanted a fun version of the boring everyday tasks you unlock as you become an adult, that you don't realise you'll have to do and the effort it takes to keep connections.

---

## 👾 Needs & Wants

### What it wants

It wants interaction and consideration. It needs you to get to know it, figure it out, to understand it and better interact with it.

### What happens when the need goes unmet?

The relationship and trust is damaged, limiting interesting interactions you can have with it and limiting its want to interact with you. If un-met and disregarded it becomes shaky, fearful and curls up as it no longer trusts you. Or moves sporadically and quickly.

### What satisfies it

Considering its needs, so keeping quiet, giving attention, not spending so much time away, helping it maintain a clean web and catch food and in doing so building a relationship which makes these needs less strict. Also 'having fun' with it, prompting it to create a new web by giving it flowers. Doing this continually, checking back in satisfies it.

### The attention economy angle

I wanted it to reflect how alot of people function on a daily basis, the mundane parts of life presented back in hopefully a slightly interesting way. Showing what quiet understanding can do and just taking the time to figure something/someone out can be rewarded. Asking the user to stay calm and quiet while interacting with it as a break from what we use to distract and keep ourselves busy with

---

## 👾 States & Behaviours

### States

| State | Appearance / behaviour / reasoning |
|-------|----------------------|
|  **Calm**|  moves slowing around, yellow colour, you've shown you can be trusted as you aren't loud, clicking (distressing) and helpful to have around (remove debris), (relationship above 10)|
| **Happy** | moves around, focus on cleaning, aware you are watching, knows you can be trusted but relationship level is lower |
| **Untrusting**| hasn't seen you in awhile, moves quicker but at the base of the web, watches the mouse not bugs, orange colour, arms tucked in |
| **Worried** | faster movement, more sporadically to grab attention when tabbed out, happens when tabbed out for too long and unfocused on its own web leaving too many debris, purple colour|
| **Distressed** |  fearful, shaky and overwhelmed by mess, curls its arms in and retreats to the base of the web, slows down |
| **Neutral** |  cautious but busy doing its own thing, have not shown you can be trusted or anything yet, orange|


### Persistence across visits
The relationship bar you can build up stays across visits but is damaged by longer time spent away, making it more difficult for the spider to re gain trust with you. Where as shorter time away will only worry it.

---

## Functionality

**TIME & WEATHER:**
| Background|  |
|-------|----------------------|
SUNRISE: | (06:00–07:30) Orange-pink (if clear) Muted orange (if cloudy/rainy)
DAY:     |(07:30–17:30) Soft sky blue (if clear) Grey (if cloudy/rainy), darkens as hours pass
SUNSET:  | (17:30–20:00) Vivid orange to amber (clear) Muted grey-orange (cloudy)
NIGHT:   |(20:00–05:59) Dark navy (clear or cloudy)

### EMOTIONS

Distressed to Calm should take 10-ish seconds of quiet, with focused attention

If the user has been away for a long time, the spider becomes “untrusted”. “Untrusted” sits between distressed and calm.

With the more AFK hours, the longer it takes to reach calm.

When the user clicks away / tab is not focus:
- spider becomes worried  
- moves quickly
- loses trust
- takes a long time to calm down when the user returns

When the user returns and stays quiet:
- trust slowly rebuilds
- transitions: *worried* to *untrusted* to *calm*

Each additional loud event or 'debris‑overrun' adds +10 seconds to the frustration duration after already in that state.

The spider becomes less reactive the more positive visits you have.
### SPIDER WEB CLEANING

When fewer than 5 debris are stuck, the spider will slowly remove them on its own. 6+ it becomes frustrated and 8+ distressed.

There's a 5-second cooldown between each self-clean so it feels deliberate rather than instant and rushed.

Meaning the spider appreciates human help, it can manage a small mess alone, but it's slowly. Human removal is instant and earns +1 relationship point

### BAD WEATHER DEBRIS

Rain and wind speeds up spawning, and lower the stuck threshold that causes fear so storms can realistically overwhelm the spider, needing more support

### NEW WEB SELECTION

When relationship is above 50, the spider will try to draw different, unused or less familiar webs.

---

## AI & Prompting Process

### Tools used

- Claude
- Copilot
- (Illustrator and Photoshop for the drawings)

Claude has been better for more accurate, expansive help but Co-pilot allows me to do more of the work and only provide guidence to help execute my ideas without unwanted deviation, as I dont understand code or its capabilities well to begin with. I feel more in control of the outcomes when using Co-pilot to help even though its less effective. 

### How you used them

Copy-pasting back and forth over multiple sessions, debugging, figuring out what is actually doable through code and figuring out where specifically some bit needed to be coded. Using my ideas but help implementing them or showing me a way about something I didn't consider or know possible.

### What worked, what didn't

What workings was asking it to simplify with step b step instructions so I could see where exactly what I needed to add should go.

Too complex or too simple would mean the AI didnt understand what or where I wanted to figure out an addition to the code often breaking the code if copy and pasting.

### What didn't work

What did you prompt that gave poor results? How did you adjust?

---

## Reflection

### What I'd do differently

I'd put more research behind it, and I want to push my ideas further and try not to limit myself by what I think is capable as I'm not even fully aware. To make it less metaphorical and unclear and 'just an experience' but an experience that leaves the user with something more, be that new information, a new tool or practice or a new understanding. I don't think I did that well with this in this project. Id work on refining my idea more. Id also figure out how to test it better as its hard to test new additions that are weather dependant.
### What I'm most proud of

What moment, decision, or detail are you happiest with? I'm most proud of the fact it (for the most part) functions as intended and that I was even capable of making something like this. The spider to me feels like it has very clear emotions, is interesting to interact with

### Where this sits in my practice
I think I like to connect human experiences into things where its not initially clear, as some weird form of story telling where I hope to create something as many people as possible can see parts of themselves in. This project has been really fun to see what I am capable of even in a small amount of time. This project showed me different ways we can create stories and how different mediums could help with that, which is something I want to explore in my work.

---
