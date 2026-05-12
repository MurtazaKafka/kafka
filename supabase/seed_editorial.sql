-- kafka editorial seed.
--
-- prerequisite: sign in to the running app once with the email you want for
-- the editorial curator, then pick the username `kafka` on the username-setup
-- screen. this script looks that profile up by username and attaches every
-- editorial pick to it.
--
-- safe to re-run: works, editions, and the editorial review for each book are
-- upserted; editorial_picks rows replace by review_id.
--
-- selections are inspired by recommendations published on Five Books
-- (fivebooks.com). the review prose below is written for kafka — Five Books
-- text is not copied. each blurb closes with an attribution line.

create or replace function seed_editorial(
  p_title text,
  p_author text,
  p_year int,
  p_lang text,
  p_body text,
  p_position int
) returns void language plpgsql as $$
declare
  curator_id uuid;
  w_id uuid;
  e_id uuid;
  r_id uuid;
begin
  select id into curator_id from profiles where username = 'kafka' limit 1;
  if curator_id is null then
    raise exception 'no profile with username = kafka. sign in to the app, pick username kafka, then re-run.';
  end if;

  -- work
  select id into w_id from works
    where title = p_title and author = p_author limit 1;
  if w_id is null then
    insert into works (title, author, original_year)
      values (p_title, p_author, p_year)
      returning id into w_id;
  end if;

  -- edition (one edition per language for the curator's purposes)
  select id into e_id from editions
    where work_id = w_id and language = p_lang limit 1;
  if e_id is null then
    insert into editions (work_id, title, language, published_year)
      values (w_id, p_title, p_lang, p_year)
      returning id into e_id;
  end if;

  -- review (upsert by user_id, edition_id)
  insert into reviews (user_id, edition_id, body, language, status, published_at)
    values (curator_id, e_id, p_body, p_lang, 'published', now())
    on conflict (user_id, edition_id) do update set
      body = excluded.body,
      language = excluded.language,
      status = 'published',
      published_at = coalesce(reviews.published_at, excluded.published_at)
    returning id into r_id;

  -- editorial pick
  insert into editorial_picks (review_id, position)
    values (r_id, p_position)
    on conflict (review_id) do update set position = excluded.position;
end $$;


-- ─── selections ──────────────────────────────────────────────────────
-- position controls order on the editorial tab (1 = top, top is also the
-- landing-page hero for signed-out visitors).

-- 1. science fiction
select seed_editorial(
  'Solaris',
  'Stanisław Lem',
  1961,
  'en',
  $body$The station above the planet has a library that takes up two whole floors, and Kelvin spends a long chapter reading through it — every theory humanity has had about Solaris over a hundred years, every theory wrong. Lem put it there as a joke about science. It works as a joke. It also works as the saddest thing in the book, because the visitor Solaris sends Kelvin is his wife, who killed herself ten years earlier, and Kelvin has the same number of theories about her as the library has about the planet, and he is going to be just as wrong. Skip the Soderbergh. Skip the Tarkovsky if you must. Read the book first.

via Five Books, fivebooks.com →$body$,
  1
);

select seed_editorial(
  'The Left Hand of Darkness',
  'Ursula K. Le Guin',
  1969,
  'en',
  $body$Two people cross eight hundred miles of ice on foot. One is a man from Earth who has spent the whole novel failing to read the people around him. The other is a Gethenian whose body does not have a sex until once a month, exiled for trying to do politics in a country that does not think it has any. They start out hating each other. The ice does not negotiate. By the time they get to the other side something has happened between them that the man has not yet found the word for. Le Guin does not give him the word. The myth chapters interleaved with the journey are the secret heart of the book. Read them at the same pace as the plot, not after.

via Five Books, fivebooks.com →$body$,
  2
);

select seed_editorial(
  'Roadside Picnic',
  'Arkady & Boris Strugatsky',
  1972,
  'en',
  $body$Aliens visited Earth, briefly, and left. That happens off-page, before chapter one. What they left is the problem — six Zones full of debris that obeys rules nobody understands, combed for artifacts by stalkers who go in for money and come out wrong, when they come out. The title is the alien-encounter theory the book offers: that visitors stopped on Earth the way drivers stop at a roadside picnic, and we are the ants. Olena Bormashenko's 2012 translation puts back what the Soviet editors cut. Better than the Tarkovsky film, which is saying something. The last page, with Redrick on his knees in front of the Golden Sphere, is one of the great endings.

via Five Books, fivebooks.com →$body$,
  3
);

-- 2. cognitive science
select seed_editorial(
  'Gödel, Escher, Bach',
  'Douglas Hofstadter',
  1979,
  'en',
  $body$Seven hundred pages on what self-reference does to a system. The book braids three figures — a logician, a printmaker, a composer — into one argument: consciousness is the kind of thing that happens when a process becomes able to point at itself. Between chapters Hofstadter writes dialogues in which Achilles and the Tortoise use the chapter's idea against him on the next page. It is the most digressive book on this list. Read it twice or do not finish it once. The MIU puzzle in chapter one is the test. If it bores you, the rest will too. Hofstadter wrote better books after — I Am a Strange Loop is the short version of the argument — but none with quite this much young confidence.

via Five Books, fivebooks.com →$body$,
  4
);

select seed_editorial(
  'Thinking, Fast and Slow',
  'Daniel Kahneman',
  2011,
  'en',
  $body$Kahneman wrote one famous book at the end of his career and this is it. The first three hundred pages catalog the heuristics he and Tversky spent forty years describing — anchoring, availability, base-rate neglect, the planning fallacy — and they are still the cleanest explanations of those ideas anywhere. The last hundred and fifty pages are the ones nobody cites. He turns to happiness, distinguishes the self that is living from the self that remembers, and argues we make decisions for the second one without noticing. Some of the priming studies in chapter four did not replicate. Read it anyway, with the skepticism Kahneman would have wanted. The mind is what is left after you subtract everything it gets wrong.

via Five Books, fivebooks.com →$body$,
  5
);

select seed_editorial(
  'The Embodied Mind',
  'Francisco Varela, Evan Thompson & Eleanor Rosch',
  1991,
  'en',
  $body$Three authors — a biologist, a philosopher, a cognitive scientist — sat down in 1991 and argued that cognitive science had a Cartesian assumption it could not afford. Mind, they said, is not a calculator in the skull running representations. Mind is what happens when a body moves through a world that it is also making. They read the Madhyamaka Buddhists as carefully as they read the neuroscientists. Half the field thought they were doing comparative religion. The other half built enactivism on top of them, then predictive processing, and now most of the interesting work in the field. Thirty-five years on, the book reads less like a manifesto than a diagnosis nobody wanted at the time and everybody has quietly accepted since.

via Five Books, fivebooks.com →$body$,
  6
);

-- 3. crime
select seed_editorial(
  'The Daughter of Time',
  'Josephine Tey',
  1951,
  'en',
  $body$A detective novel where the detective is in traction and the crime is from 1483. Inspector Alan Grant, hospitalized and bored, becomes fixated on a portrait of Richard III and decides to relitigate the case. The witnesses are dead. The suspects are dead. The evidence is documents. What Tey actually writes, underneath the puzzle, is a book about how a lie becomes history — how the Tudor propaganda calcified into Shakespeare into school textbooks into the thing every English-speaking child knows about the man. Two hundred pages. Nobody has written a better short book about historiography, and almost nobody has noticed it is one. Crime fiction can do this. It almost never does.

via Five Books, fivebooks.com →$body$,
  7
);

select seed_editorial(
  'Red Harvest',
  'Dashiell Hammett',
  1929,
  'en',
  $body$The Continental Op arrives in a Montana mining town called Personville — Poisonville to the people living in it — and is hired by a man who is dead before chapter three. From there the Op proceeds, methodically, to clean the town out by playing its four factions against each other until they have killed most of each other. He narrates this the way an accountant narrates a ledger. Hammett does not psychologize. He counts. By chapter twenty the Op is enjoying it and worried about that, in one sentence, and then he goes back to work. Every later American crime novel about a man who likes his job too much owes Hammett a debt that none of them has ever paid.

via Five Books, fivebooks.com →$body$,
  8
);

-- 4. nobel laureates
select seed_editorial(
  'The Remains of the Day',
  'Kazuo Ishiguro',
  1989,
  'en',
  $body$Stevens is the head butler of a great English house in 1956 and he is driving across the country to see a woman he might once have loved if he had ever once let himself notice. The whole novel is his voice, looking back, narrating around what he cannot say. Ishiguro's trick is that you can hear what Stevens cannot — what he is doing to himself in real time, what he has done, what he is finally admitting on a bench in Weymouth on the second-to-last page. Read it in two sittings. The first is for the surface. The second is for what is underneath. He won the Nobel for it in 2017, late, the way these things usually go.

via Five Books, fivebooks.com →$body$,
  9
);

select seed_editorial(
  'Beloved',
  'Toni Morrison',
  1987,
  'en',
  $body$A young woman walks out of a creek in 1873 and into the house of the woman who killed her, eighteen years earlier, when the slave catchers came. She does not say who she is. She does not have to. Morrison is not writing a ghost story, though the ghost is real on the page. She is writing about what slavery did to mothers — specifically, to the kind of love that has to take a child's life into account when calculating freedom. The prose moves between voices and tenses without telling you it is moving. Read the chapter that begins "I am Beloved and she is mine" out loud. The book did not need the Pulitzer or the Nobel. It is the book.

via Five Books, fivebooks.com →$body$,
  10
);

select seed_editorial(
  'Snow',
  'Orhan Pamuk',
  2002,
  'en',
  $body$A poet named Ka comes back to Turkey after years in Frankfurt and travels to the eastern city of Kars to report on young women killing themselves because they have been forbidden their headscarves. The snow shuts the roads. The city becomes its own country for three days. A coup happens in a theater. Pamuk writes about Turkey the way Dostoevsky wrote about Russia — as the place where Europe and not-Europe are arguing inside the same person — and the argument does not end. The novel infuriated the Islamists and the secular Kemalists both, which is the best evidence it is honest. Pamuk got the Nobel four years later. Snow is the book to start with, not Istanbul.

via Five Books, fivebooks.com →$body$,
  11
);

-- 5. persian literature (bilingual nod — fa review on a fa edition)
select seed_editorial(
  'تولدی دیگر',
  'فروغ فرخزاد',
  1964,
  'fa',
  $body$فروغ بیست‌وهفت ساله بود وقتی این کتاب را منتشر کرد. سه دفتر شعر پیش از آن نوشته بود، اما در آن‌ها هنوز در دستِ کسی می‌نوشت که آموخته بود زن چگونه باید شعر بگوید. در «تولدی دیگر» دست‌ها مالِ خودش می‌شوند. شعرِ «آن روزها» را با صدای بلند بخوان. «ایمان بیاوریم به آغازِ فصلِ سرد» را که پس از مرگش چاپ شد، در همان روز بخوان. شعرِ فارسی تا آن وقت بلد نبود این‌گونه از بدن، از خانه، از خیابان‌های تهران، و از مرگ، در یک سطر و بی عذرخواهی، حرف بزند. این کتاب یاد گرفت.

پیشنهاد شده در Five Books — fivebooks.com →$body$,
  12
);

-- done. drop the helper so the schema stays tidy.
drop function seed_editorial(text, text, int, text, text, int);
