export interface ListeningLine {
  speaker: string; // '★' | '★★' | '☆' | '☆☆' | 'Narrator' | 'Interviewer' | 'Jason'
  text: string;
}

export interface ListeningQuestion {
  number: number;
  question: string;
}

export interface ListeningItem {
  id: string; // e.g. 'no1', 'A', 'F'
  title?: string; // Part 2/4 passage title
  situation?: string; // Part 3 situation text
  lines: ListeningLine[];
  questions: ListeningQuestion[];
}

export interface ListeningPart {
  part: number;
  label: string;
  description: string;
  audioFile: string;
  items: ListeningItem[];
}

export interface ListeningExam {
  id: string;         // e.g. '2025-3'
  label: string;      // e.g. '2025年度第3回'
  parts: ListeningPart[];
}

export const LISTENING_EXAMS: ListeningExam[] = [
  {
    id: '2025-3',
    label: '2025年度第3回',
    parts: [
      {
        part: 1,
        label: 'Part 1：会話問題',
        description: '10の会話を聞き、各会話に続く質問に答えなさい。会話と質問は1回だけ読まれます。',
        audioFile: '/listening/2025-3-part1.mp3',
        items: [
          {
            id: 'no1',
            lines: [
              { speaker: '☆', text: "Hi, Alberto. Are you still working at CJX Software?" },
              { speaker: '★★', text: "Yes. I'm in the same post as when you left." },
              { speaker: '☆', text: "You're still a junior programmer? But that was four years ago, and I've never met anyone who can write code as well as you can." },
              { speaker: '★★', text: "I guess I'm just not management material." },
              { speaker: '☆', text: "Have you discussed it with your boss? You won't get anywhere if you don't sell yourself." },
              { speaker: '★★', text: "You know me. I don't like to cause trouble." },
            ],
            questions: [{ number: 1, question: "What does the woman imply about the man?" }],
          },
          {
            id: 'no2',
            lines: [
              { speaker: '★★', text: "Oh, you're back from Mexico. How was the resort?" },
              { speaker: '☆☆', text: "Awful. It turned out the ads were really deceptive." },
              { speaker: '★★', text: "What do you mean?" },
              { speaker: '☆☆', text: "First of all, the stunning facilities in the photo turned out to be ancient, and the rooms were filthy." },
              { speaker: '★★', text: "That doesn't sound good." },
              { speaker: '☆☆', text: "Plus, the brochure said meals were included, but the portions were tiny. You had to shell out extra if you didn't want to starve." },
              { speaker: '★★', text: "I guess you won't be staying there again, then." },
              { speaker: '☆☆', text: "Absolutely not." },
            ],
            questions: [{ number: 2, question: "What does the woman say about the resort?" }],
          },
          {
            id: 'no3',
            lines: [
              { speaker: '★', text: "How are your street performances going, Maya?" },
              { speaker: '☆☆', text: "Great. But I'm looking for a cart I can use to carry all my amplifiers and battery packs around in. Do you use one in your shows?" },
              { speaker: '★', text: "Mine was gifted to me and is more than sufficient for my needs, but I can't say I'd necessarily recommend it." },
              { speaker: '☆☆', text: "What's the drawback?" },
              { speaker: '★', text: "I don't use all the space it provides, which makes it impractical. There are compact, lightweight ones these days that are just as sturdy and are easier to maneuver in tight spaces." },
            ],
            questions: [{ number: 3, question: "What does the man say about his cart?" }],
          },
          {
            id: 'no4',
            lines: [
              { speaker: '★★', text: "I've heard the food at this restaurant is amazing. I'm glad we could get a reservation tonight." },
              { speaker: '☆☆', text: "I'm not so sure, Paul. I've seen a lot of red flags already." },
              { speaker: '★★', text: "But our food hasn't even come yet!" },
              { speaker: '☆☆', text: "Take the menu, for instance. It had about a hundred items on it! I doubt they make any one dish very well if they're spreading themselves so thin. Also, the bathroom was filthy! I imagine they give the same level of attention to the food." },
              { speaker: '★★', text: "I think you're jumping the gun a bit. Let's try the food before passing judgment!" },
            ],
            questions: [{ number: 4, question: "What do we learn about the woman?" }],
          },
          {
            id: 'no5',
            lines: [
              { speaker: '☆☆', text: "This house needs so many renovations." },
              { speaker: '★', text: "I know. I'm getting fed up with the ancient countertops in the kitchen. And don't get me started on the peeling paint in the bedroom." },
              { speaker: '☆☆', text: "I was reading online the other day that homeowners should prioritize structural issues first." },
              { speaker: '★', text: "What does that mean?" },
              { speaker: '☆☆', text: "We might need to postpone fixing up the kitchen. There's moisture on the walls of the basement, and that could be a sign of issues with the foundations of the house. We can't afford to put that off." },
            ],
            questions: [{ number: 5, question: "What does the woman say about the house?" }],
          },
          {
            id: 'no6',
            lines: [
              { speaker: '☆☆', text: "Professor McIntyre's class has been quite frustrating for me." },
              { speaker: '★★', text: "Me too! I just don't see how it's relevant to real engineering scenarios." },
              { speaker: '☆☆', text: "I recognize the need to understand theoretical principles, but it's just so disconnected from what we're learning in other classes." },
              { speaker: '★★', text: "Professor McIntyre is really passionate, and his lectures are sometimes fascinating, but I just wish he'd realize what our practical needs as future engineers who are going to be going out and actually designing structures are." },
            ],
            questions: [{ number: 6, question: "What does the woman say about the class?" }],
          },
          {
            id: 'no7',
            lines: [
              { speaker: '★★', text: "That was a rough meeting." },
              { speaker: '☆', text: "I know. I felt I had no choice but to confront our client about the overdue invoices." },
              { speaker: '★★', text: "I can't believe they accused us of shipping faulty products as a reason for not paying. There's no way such a high percentage could have been defective." },
              { speaker: '☆', text: "They really have a lot of nerve. At least they agreed to pay in the end." },
              { speaker: '★★', text: "I wonder if we should refuse further orders from them, though. I don't want to go through this hassle again." },
            ],
            questions: [{ number: 7, question: "What does the man imply about the client?" }],
          },
          {
            id: 'no8',
            lines: [
              { speaker: '★★', text: "Hey, Kyoko! I haven't seen you around campus recently." },
              { speaker: '☆☆', text: "Hi, Jed. I've been busy sorting out my graduate school plans. I've decided to enroll in an architecture program." },
              { speaker: '★★', text: "Oh, really? I thought you wanted to focus on combating climate change." },
              { speaker: '☆☆', text: "Well, the built environment is responsible for almost half of all carbon emissions, so environmentally conscious building design can have a tremendous impact." },
              { speaker: '★★', text: "Not all architecture firms want to switch over to designing green buildings, though. You might have to contribute to the problem before you get the chance to help solve it." },
            ],
            questions: [{ number: 8, question: "What does the man imply about the woman?" }],
          },
          {
            id: 'no9',
            lines: [
              { speaker: '★★', text: "How much longer do you think our division is going to spend skirting around the supplier issue?" },
              { speaker: '☆', text: "Tell me about it! We've wasted three weeks on pointless, repetitive meetings already. At this rate, it's going to cost us more than the supply delays." },
              { speaker: '★★', text: "I think management is just hesitant to commit. They're probably waiting for someone to suggest a new course of action so they don't take the fall if it goes wrong." },
              { speaker: '☆', text: "Yeah, someone like us, probably. It's very frustrating. Everyone knows the smaller supplier can't handle the increased volume, but no one wants to say it outright." },
              { speaker: '★★', text: "You're right. I was tempted to bring that up at the morning meeting yesterday, but I didn't want to ruffle too many feathers." },
              { speaker: '☆', text: "Well, maybe some feathers need to be ruffled. Otherwise, we'll be here next month having the same conversation, and we'll be overworked from having to deal with the supply delays." },
              { speaker: '★★', text: "I might prepare some data to push the point. With hard numbers in front of them, it will be tough for management to avoid addressing the problem head-on." },
              { speaker: '☆', text: "Good idea. Let me know if you need any help." },
            ],
            questions: [{ number: 9, question: "What opinion do these people express?" }],
          },
          {
            id: 'no10',
            lines: [
              { speaker: '☆', text: "Hi, Troy. Thanks for taking the time to talk." },
              { speaker: '★', text: "It's about your son Marty joining the army, right?" },
              { speaker: '★★', text: "That's right. Wishing to serve your country is noble, and we want to be supportive, but as we're not a military family, we're anxious about his suitability." },
              { speaker: '☆', text: "You spent many years in the army, right? We'd really appreciate your thoughts." },
              { speaker: '★', text: "Yeah. I renewed my contract twice, in fact. Look, it's a unique, disciplined lifestyle that's not for everyone, so I understand your anxiety, but the camaraderie and sense of purpose are like nowhere else." },
              { speaker: '★★', text: "I can see that, but Marty's never been into physical activities, so I wonder if he's cut out for it." },
              { speaker: '★', text: "The physical training is rigorous, and some recruits drop by the wayside, but it's often mental strength that really makes a soldier. Marty seems pretty determined when he sets his mind to something." },
              { speaker: '☆', text: "Don't I know it! We're both doctors, and we hoped he'd follow in our footsteps, but he's made it crystal clear that isn't in the cards." },
              { speaker: '★', text: "You should consider attending an open house event at a nearby base. They can provide information on military life, and you can talk directly to soldiers and recruitment officers." },
              { speaker: '☆', text: "Ultimately, we know it's Marty's decision whether to sign up or not, but that might be a good idea." },
              { speaker: '★★', text: "At least we'll have a clearer idea of what lies in store for him. Thanks, Troy." },
            ],
            questions: [{ number: 10, question: "What does Troy recommend that the couple do?" }],
          },
        ],
      },
      {
        part: 2,
        label: 'Part 2：長文聴解問題',
        description: '5つのパッセージ(A)〜(E)を聞き、各パッセージに続く2つの質問に答えなさい。',
        audioFile: '/listening/2025-3-part2.mp3',
        items: [
          {
            id: 'A',
            title: 'The Sassanian Empire',
            lines: [
              { speaker: 'Narrator', text: "The early third century saw the emergence of the militarily powerful Sassanian Empire. Centered in Persia, the empire's prime location contributed to its development into a prosperous commercial hub for the Silk Road trade. One reason the empire is particularly interesting to historians is that its bureaucracy was concentrated in the capital rather than across its diverse provinces. The government's approval and finance were required for most undertakings, from infrastructure projects, such as roadbuilding, to agricultural policies. Provincial officials had to report directly to the government, allowing it to keep a tight rein on power." },
              { speaker: 'Narrator', text: "Sassanian emperors encouraged the pursuit of scientific knowledge and scholarship, and many works were translated into the Sassanians' language. Architecture and art experienced a revival, and hospitals and medical centers were established. The empire also gained a reputation for finely crafted metalwork. Despite all the empire's achievements, prolonged conflicts with, among others, the Roman and Byzantine Empires meant its borders were constantly changing. Such circumstances, along with internal strife and revolts, gradually sapped the strength of the Sassanians. In the seventh century, the Sassanian Empire found it increasingly difficult to resist Arab forces, which ultimately overpowered it, bringing about the empire's downfall." },
            ],
            questions: [
              { number: 11, question: "What is one thing the speaker says about the Sassanian Empire?" },
              { number: 12, question: "What was one issue the Sassanian Empire faced?" },
            ],
          },
          {
            id: 'B',
            title: 'The US Census',
            lines: [
              { speaker: 'Narrator', text: "The US Census is carried out every ten years in order to count the population and gather data about things like citizens' ages, race, and income, providing vital information for the development and growth of the United States. Following the census, a second survey called the Post-Enumeration Survey, or PES, is conducted to evaluate its accuracy. However, the PES often reveals a tendency for the census to misrepresent minority groups. For instance, a recent PES revealed that about 5 percent of Hispanic people were overlooked. In contrast, Asians were overcounted." },
              { speaker: 'Narrator', text: "During censuses, invitations are first mailed to households nationwide, requesting that people complete surveys. However, up to one-third of people fail to respond, so census workers have to be sent to their homes, a process that is both extremely labor-intensive and costly. One proposed solution is for the Census Bureau to utilize things like tax and social security records rather than conducting massive surveys. It is estimated that about 90 percent of Americans could be counted this way. This would reduce expenses, and the savings could be used for detailed follow-ups of people who have been difficult to survey using traditional census techniques, potentially leading to a more accurate census." },
            ],
            questions: [
              { number: 13, question: "What has the Post-Enumeration Survey revealed in recent years?" },
              { number: 14, question: "What is one possible solution to the census problem?" },
            ],
          },
          {
            id: 'C',
            title: 'The Beliefs of Sir Arthur Conan Doyle',
            lines: [
              { speaker: 'Narrator', text: "Sir Arthur Conan Doyle is best known for his creation of the literary detective Sherlock Holmes, who is famous for using logic to solve crimes. Conan Doyle trained as a doctor, and his scientific knowledge is evident in the techniques used by Holmes. Therefore, it is surprising that Conan Doyle was also an avid follower of spiritualism, which is the belief that the spirits of the dead can communicate with the living. He took spiritualism very seriously, even stating that he would be willing to sacrifice his literary career if that meant more people would believe in it." },
              { speaker: 'Narrator', text: "Many people assume that Conan Doyle's belief stemmed from a desire to contact the spirit of his son, who died in 1918. However, he had written essays on the subject many years before his son's death. Interestingly, he never allowed his spiritualist ideas to influence the character of Holmes. While Conan Doyle spent much of his life trying to persuade others that supernatural powers were real, Holmes remained a skeptic throughout his adventures. In fact, Holmes often used his analytical methods to prove that supposedly supernatural happenings were simply the result of human actions." },
            ],
            questions: [
              { number: 15, question: "What is one thing we learn about Sir Arthur Conan Doyle?" },
              { number: 16, question: "What are many people mistaken about regarding Conan Doyle?" },
            ],
          },
          {
            id: 'D',
            title: 'Map Traps',
            lines: [
              { speaker: 'Narrator', text: "In the past, maps were occasionally published with incorrect information. These were not always accidents but sometimes deliberate attempts by map makers to detect unauthorized copying of their work by other cartographers. Known as map traps, these took many forms. They included, for example, misspelled names, misshapen geographical features, or fictitious places. If a new map was then published with any of these irregularities on it, the original creators had grounds to take legal action against the copyright theft." },
              { speaker: 'Narrator', text: "A notable historical example of a map trap is the town of Agloe, supposedly in the state of New York. Years after it was made up by General Drafting Co., it appeared on another company's map, which prompted them to sue for plagiarism. In its defense, the accused company pointed to a store with Agloe in its name that had been built right where the town appeared on the map. This was seen by the court as sufficient evidence that the town really existed, and the case was dropped. Ironically, however, it turns out that when the owners of the store were deciding on its name, they had actually borrowed it from General Drafting Co.'s original map." },
            ],
            questions: [
              { number: 17, question: "Why did some map makers add incorrect information to maps?" },
              { number: 18, question: "What was true about the town named Agloe?" },
            ],
          },
          {
            id: 'E',
            title: 'A Look at Laziness',
            lines: [
              { speaker: 'Narrator', text: "In today's health-conscious society, the benefits of physical activity are widely understood and acknowledged. Yet despite medical professionals' and fitness experts' constant reminders of the importance of exercise and the health risks that come with physical inactivity, people seem drawn to sedentary behavior. To many people, lazing on the couch after a day of work is more appealing than jogging or working out. From an evolutionary standpoint, this paradox makes sense because conserving energy would have allowed early humans to hunt, gather food, and evade predators more efficiently." },
              { speaker: 'Narrator', text: "In 2018, researchers in Canada conducted a study to better understand people's tendency to avoid physical activity. The researchers monitored participants' brain activity while showing them computer images depicting either physical activity or relaxation. As the images appeared, participants had to move an avatar toward the active images and away from the relaxing images as fast as possible. To the researchers' surprise, moving the avatar toward the active images required the participants' brains to work harder. The researchers say this need for increased resources suggests laziness could result from how our brains are inherently wired rather than from a lack of willpower." },
            ],
            questions: [
              { number: 19, question: "What does the speaker suggest about conserving energy?" },
              { number: 20, question: "What did the researchers in Canada conclude?" },
            ],
          },
        ],
      },
      {
        part: 3,
        label: 'Part 3：Real-life situations',
        description: '5つのパッセージ(F)〜(J)を聞き、各質問に答えなさい。各パッセージの前に10秒間、状況と質問を読む時間があります。',
        audioFile: '/listening/2025-3-part3.mp3',
        items: [
          {
            id: 'F',
            situation: "You are remodeling your kitchen and have a budget of $16,000, including a dishwasher.",
            lines: [
              { speaker: 'Narrator', text: "There are a few kitchen models that I usually recommend. If you're on a budget, I'd go for the Greenway Standard. The design is basic, but it uses high-quality materials and has a lot of storage space. The price is very reasonable at $14,000, but that doesn't include a dishwasher. Adding that would bring the price up to about $15,000. Then there's the Fairway Midi. That has a built-in dishwasher and attractive Moroccan-style tiling. At $17,000, it's still a good value. If you want to go upscale, I'd recommend the Spencer European or the Spencer Deluxe. The Spencer European comes with Italian marble countertops, touchless faucets, and a built-in dishwasher. That's $25,000, so quite pricey. The Spencer Deluxe is the same kitchen but with quartz countertops, which brings the price down substantially to around $20,000." },
            ],
            questions: [{ number: 21, question: "Which kitchen should you choose?" }],
          },
          {
            id: 'G',
            situation: "You need to send an important parcel overseas and want it to arrive within 5 days. You also want to be able to track it.",
            lines: [
              { speaker: 'Narrator', text: "We have several options for international delivery. If you want speedy delivery, I'd recommend our express or priority services. For both those services, prices will depend on the weight of your parcel and where you're sending it. The express service is the most expensive, and your parcel will usually arrive about three days after pickup. The priority service is a little cheaper, and delivery generally takes around four days. Both of those services also include a free parcel-tracking service, but insurance costs $100 in case your parcel gets lost or damaged. If you want to keep your costs down, our value or economy services may be more suitable. They usually take between nine and twelve days to arrive. Neither service includes parcel tracking, but the value service has an insurance option for $50." },
            ],
            questions: [{ number: 22, question: "Which delivery service should you choose?" }],
          },
          {
            id: 'H',
            situation: "You have a meeting scheduled with Oliver today at 3 p.m. You are free this afternoon after 4 p.m. and tomorrow from 10 a.m. to 2 p.m.",
            lines: [
              { speaker: 'Narrator', text: "Hi, it's Oliver. I'm really sorry, but my train has been delayed due to high winds, so I won't be able to make it to our meeting at three. The train is now scheduled to arrive at four, so is there any way we could meet from four thirty to five thirty instead? I have a dinner appointment tonight at 6 p.m. Alternatively, I'll also be around tomorrow. I'm visiting the manufacturer in the morning to negotiate a final price for the parts you requested, so if you're available in the afternoon, that would be perfect. I'll be taking the train back home at 4 p.m., so I can meet you anytime between noon and three thirty. If neither this afternoon nor tomorrow works for you, give me a call. I might be able to put my dinner plans for tonight back by an hour or so." },
            ],
            questions: [{ number: 23, question: "When can you and Oliver meet?" }],
          },
          {
            id: 'I',
            situation: "You are arranging transport for a golf tour for 10 people. Comfort is your top priority.",
            lines: [
              { speaker: 'Narrator', text: "We have four types of vehicles in our fleet. For small groups, we have our Class A vehicle. That can carry up to four passengers with luggage. Then there's our Class B vehicle, which can carry twelve passengers with luggage. However, if you have a lot of luggage, you'll need to reduce passenger numbers. If you're planning a golf tour, Class A would be OK for three people, and Class B would just accommodate ten. Space would be tight, though, so we'd recommend either a Class C or Class D vehicle. The Class C is big enough for ten passengers with luggage and golf equipment, and the Class D can carry up to twelve. The Class C is a popular choice for golfers, as it has wider seats and is a more comfortable ride than the Class D. For all vehicles, a private driver is included in the price." },
            ],
            questions: [{ number: 24, question: "Which vehicle should you book?" }],
          },
          {
            id: 'J',
            situation: "You want to buy a simulation game that is compatible with your Perseus console.",
            lines: [
              { speaker: 'Narrator', text: "You're in luck—most of our games are on sale today. Over here, we have one of my personal favorites, Aurora Crest. It's a role-playing game that makes you solve interesting puzzles to advance through the levels. The version for the Lightning 100 console is currently sold out, but the one for the Limelight 60 console is in stock. Next, we have Andromeda Signs. It's available for both the Lightning 100 and Perseus consoles. It's a simulation game—you have to manage the resources of a colony trying to live on Mars. Another top seller is Dawn Magic. Don't be fooled by the peaceful-sounding name—it's one of the most realistic fighting games on the market. It's available only for the Lightning 100 console. Finally, we have Park Madness. It's a strategy game that tests your critical thinking skills. It's available on the Limelight 60 and Perseus consoles." },
            ],
            questions: [{ number: 25, question: "Which game should you buy?" }],
          },
        ],
      },
      {
        part: 4,
        label: 'Part 4：インタビュー',
        description: 'インタビューを聞き、続く2つの質問に答えなさい。',
        audioFile: '/listening/2025-3-part4.mp3',
        items: [
          {
            id: 'interview',
            title: 'Interview with Jason Robinson, Agricultural Engineer',
            lines: [
              { speaker: 'Interviewer', text: "Jason, thanks for joining me. Can you start by telling the listeners what being an agricultural engineer entails?" },
              { speaker: 'Jason', text: "Sure. In general terms, agricultural engineers work to solve problems, often technical and scientific issues, that farmers face. That might include power supply issues, pollution and environmental concerns, and methods to increase food productivity, storage, and processing." },
              { speaker: 'Interviewer', text: "I see. And is farming in the Robinson blood?" },
              { speaker: 'Jason', text: "Not at all. My parents were both researchers in immunology, so perhaps that's where I got my scientific inclination. I considered following in their footsteps, but became interested in agriculture after working at a French vineyard one summer. I then took a degree in agricultural engineering and now specialize in agricultural infrastructure." },
              { speaker: 'Interviewer', text: "Could you explain that?" },
              { speaker: 'Jason', text: "Sure. When most people imagine a farm, they picture rows of corn or sunflowers or fields of cattle, but behind that bucolic scene is a sophisticated operation involving planning, machinery, and logistics. All these elements must run smoothly to ensure that farming can be profitable and that consumers have reasonably priced food in the supermarkets. My job entails overseeing the construction and maintenance of specialized facilities, such as silos, barns, greenhouses, and refrigeration units. Without such structures, livestock and harvested crops can be vulnerable to adverse weather conditions." },
              { speaker: 'Interviewer', text: "I see. What are some of the day-to-day challenges you face?" },
              { speaker: 'Jason', text: "These days, there's intense pressure on farmers to be more environmentally friendly. That may mean using fewer chemicals, going organic, or turning some fields into flower meadows to attract crop pollinators such as bees. It also means farmers have to reduce their carbon footprint. One way to achieve this is through the integration of renewable energy sources. One problem is that the annual income of farmers is highly correlated to the whims of weather and climatic conditions, and their attitude to investing reflects this. This often makes them reluctant to invest large sums of money for gains that may only be achieved over a long-term time frame. Part of my job is to prove to them that the ultimate payoff in terms of energy efficiency makes it worthwhile." },
              { speaker: 'Interviewer', text: "Do you have any regrets about becoming an agricultural engineer instead of an immunologist?" },
              { speaker: 'Jason', text: "What I do regret is the failures. For example, I was involved in an irrigation project in Spain. My company was contracted to build an irrigation system using groundwater to help a large vegetable farm stay operational for another couple of decades. However, the amount of accessible groundwater meant that the well ran dry after only five or six years, which left the farmer no choice but to sell up. At the time, I was heartbroken for the farmer, but looking back, it was a good lesson and has made me much more cautious about creating overoptimistic expectations. I spend a lot of time outdoors and am lucky enough to meet some hardworking, down-to-earth people. Without them, society would simply not function, so I'm grateful if I can help them in a small way." },
            ],
            questions: [
              { number: 26, question: "What does Jason say is one problem he experiences in his job?" },
              { number: 27, question: "What does Jason say he learned from his experience in Spain?" },
            ],
          },
        ],
      },
    ],
  },
];
