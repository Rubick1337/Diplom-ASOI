--
-- PostgreSQL database dump
--

\restrict lXUsQ5DIF06GqAP8DQbeu4cJNSuodLAbnUC3kKqXgUWYGzTWpqsmdHzs44APVil

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE ONLY public."ChallengeTestCases" DROP CONSTRAINT fk_testcase_challenge;
ALTER TABLE ONLY public."Challenges" DROP CONSTRAINT fk_challenge_user;
ALTER TABLE ONLY public."Users" DROP CONSTRAINT "Users_pkey";
ALTER TABLE ONLY public."Users" DROP CONSTRAINT "Users_googleId_key";
ALTER TABLE ONLY public."Users" DROP CONSTRAINT "Users_githubId_key";
ALTER TABLE ONLY public."Users" DROP CONSTRAINT "Users_email_key";
ALTER TABLE ONLY public."Challenges" DROP CONSTRAINT "Challenges_pkey";
ALTER TABLE ONLY public."Challenges" DROP CONSTRAINT "Challenges_name_key";
ALTER TABLE ONLY public."ChallengeTestCases" DROP CONSTRAINT "ChallengeTestCases_pkey";
ALTER TABLE public."Users" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."Challenges" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."ChallengeTestCases" ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE public."Users_id_seq";
DROP TABLE public."Users";
DROP SEQUENCE public."Challenges_id_seq";
DROP TABLE public."Challenges";
DROP SEQUENCE public."ChallengeTestCases_id_seq";
DROP TABLE public."ChallengeTestCases";
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ChallengeTestCases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ChallengeTestCases" (
    id integer NOT NULL,
    "challengeId" integer NOT NULL,
    "inputArgs" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "expectedOutput" jsonb NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    weight integer DEFAULT 1 NOT NULL,
    "isHidden" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."ChallengeTestCases" OWNER TO postgres;

--
-- Name: ChallengeTestCases_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ChallengeTestCases_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ChallengeTestCases_id_seq" OWNER TO postgres;

--
-- Name: ChallengeTestCases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ChallengeTestCases_id_seq" OWNED BY public."ChallengeTestCases".id;


--
-- Name: Challenges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Challenges" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text NOT NULL,
    mode character varying(255) DEFAULT 'harness'::character varying NOT NULL,
    "funcName" character varying(255) NOT NULL,
    properties jsonb,
    "timeLimitMs" integer DEFAULT 2000 NOT NULL,
    "createdByUserId" integer
);


ALTER TABLE public."Challenges" OWNER TO postgres;

--
-- Name: Challenges_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Challenges_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Challenges_id_seq" OWNER TO postgres;

--
-- Name: Challenges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Challenges_id_seq" OWNED BY public."Challenges".id;


--
-- Name: Users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Users" (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    password character varying(255),
    email character varying(255) NOT NULL,
    role integer NOT NULL,
    "refreshToken" character varying(255),
    "googleId" character varying(255),
    "githubId" character varying(255),
    experience integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Users" OWNER TO postgres;

--
-- Name: Users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Users_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Users_id_seq" OWNER TO postgres;

--
-- Name: Users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Users_id_seq" OWNED BY public."Users".id;


--
-- Name: ChallengeTestCases [id]; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChallengeTestCases" ALTER COLUMN id SET DEFAULT nextval('public."ChallengeTestCases_id_seq"'::regclass);


--
-- Name: Challenges [id]; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Challenges" ALTER COLUMN id SET DEFAULT nextval('public."Challenges_id_seq"'::regclass);


--
-- Name: Users [id]; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users" ALTER COLUMN id SET DEFAULT nextval('public."Users_id_seq"'::regclass);


--
-- Data for Name: ChallengeTestCases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ChallengeTestCases" (id, "challengeId", "inputArgs", "expectedOutput", "order", weight, "isHidden") FROM stdin;
1	1	[]	"Hello, World!"	0	1	f
2	2	[1, 2]	3	0	1	f
3	2	[10, 5]	15	1	1	f
4	2	[-7, 4]	-3	2	1	f
5	3	["hello"]	"olleh"	0	1	f
6	3	["world"]	"dlrow"	1	1	f
7	4	["level"]	true	0	1	f
8	4	["hello"]	false	1	1	f
9	4	["racecar"]	true	2	1	f
10	5	[[1, 2, 3]]	6	0	1	f
11	5	[[5, -2, 4]]	7	1	1	f
12	6	[0]	1	0	1	f
13	6	[1]	1	1	1	f
14	6	[5]	120	2	1	f
\.


--
-- Data for Name: Challenges; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Challenges" (id, name, description, mode, "funcName", properties, "timeLimitMs", "createdByUserId") FROM stdin;
1	hello-world	Напишите функцию solution(), которая возвращает строку "Hello, World!"	harness	solution	\N	2000	1
2	sum-two-numbers	Напишите функцию solution(a, b), которая возвращает сумму двух чисел a и b.	harness	solution	{"difficulty": 2}	1500	1
3	reverse-string	Напишите функцию solution(str), которая возвращает строку str в обратном порядке.	harness	solution	{"difficulty": 3}	2000	1
4	is-palindrome	Напишите функцию solution(str), которая возвращает true, если строка является палиндромом.	harness	solution	{"difficulty": 4}	2000	1
5	array-sum	Напишите функцию solution(arr), которая возвращает сумму всех чисел массива arr.	harness	solution	{"difficulty": 3}	2000	1
6	factorial	Напишите функцию solution(n), которая возвращает факториал числа n (n!); 0! = 1.	harness	solution	{"difficulty": 5}	3000	1
\.


--
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Users" (id, username, password, email, role, "refreshToken", "googleId", "githubId", experience) FROM stdin;
1	admin	$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy	admin@example.com	1	\N	\N	\N	0
\.


--
-- Name: ChallengeTestCases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ChallengeTestCases_id_seq"', 14, true);


--
-- Name: Challenges_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Challenges_id_seq"', 6, true);


--
-- Name: Users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Users_id_seq"', 1, true);


--
-- Name: ChallengeTestCases ChallengeTestCases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChallengeTestCases"
    ADD CONSTRAINT "ChallengeTestCases_pkey" PRIMARY KEY (id);


--
-- Name: Challenges Challenges_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Challenges"
    ADD CONSTRAINT "Challenges_name_key" UNIQUE (name);


--
-- Name: Challenges Challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Challenges"
    ADD CONSTRAINT "Challenges_pkey" PRIMARY KEY (id);


--
-- Name: Users Users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- Name: Users Users_githubId_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_githubId_key" UNIQUE ("githubId");


--
-- Name: Users Users_googleId_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_googleId_key" UNIQUE ("googleId");


--
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- Name: Challenges fk_challenge_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Challenges"
    ADD CONSTRAINT fk_challenge_user FOREIGN KEY ("createdByUserId") REFERENCES public."Users"(id) ON DELETE SET NULL;


--
-- Name: ChallengeTestCases fk_testcase_challenge; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChallengeTestCases"
    ADD CONSTRAINT fk_testcase_challenge FOREIGN KEY ("challengeId") REFERENCES public."Challenges"(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict lXUsQ5DIF06GqAP8DQbeu4cJNSuodLAbnUC3kKqXgUWYGzTWpqsmdHzs44APVil

