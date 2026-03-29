/**
 * A sample Ink story for demo/testing purposes.
 * This allows users to test the preview and export without an AI provider.
 */
export const SAMPLE_INK_SOURCE = `
VAR confidence = 0
VAR knowledge = 0
VAR approach = ""

-> start

=== start ===
# ENDING: none
You're a newly hired project manager at a mid-size tech company. Today is your first day leading a team of eight developers on a critical product launch.

Your manager drops by your desk with a concerned look.

"We've got a problem," she says. "The client just moved the deadline up by two weeks. The team doesn't know yet."

* [Break the news to the team immediately]
    ~ approach = "transparent"
    ~ confidence = confidence + 1
    You gather the team in the meeting room right away.
    -> team_meeting
* [Review the project plan first, then talk to the team]
    ~ approach = "prepared"
    ~ knowledge = knowledge + 1
    You spend an hour reviewing the project scope and timeline before calling a meeting.
    -> review_first
* [Ask your manager for more context before doing anything]
    ~ knowledge = knowledge + 1
    ~ confidence = confidence + 1
    "Before I talk to the team, can you tell me why the deadline changed?"
    -> ask_manager

=== ask_manager ===
Your manager explains: "The client's competitor is launching a similar product. They need to beat them to market."

~ knowledge = knowledge + 1

"That context helps," you say. "Now I can frame this as an opportunity rather than just bad news."

* [Now gather the team]
    ~ approach = "contextual"
    -> team_meeting
* [Email the team first with a brief heads-up]
    ~ approach = "gradual"
    You send a short message: "Team sync in 30 minutes. We have an exciting challenge ahead."
    -> team_meeting

=== review_first ===
Looking at the project plan, you identify three features that could be descoped without affecting the core value proposition.

~ knowledge = knowledge + 1

You also notice the team has been consistently delivering ahead of estimates on similar tasks.

* [Present the descoping options to the team]
    ~ approach = "prepared"
    ~ knowledge = knowledge + 1
    -> team_meeting
* [Go to the team with just the deadline change]
    -> team_meeting

=== team_meeting ===
The team listens as you explain the situation.

{approach == "transparent": You lay out the facts directly. Some team members look stressed, others look determined.}
{approach == "prepared": You present the deadline change alongside your analysis and descoping options. The team seems reassured that you've already thought this through.}
{approach == "contextual": You share the competitive context. "This isn't just a deadline change — it's a chance to make a real market impact." The team leans in.}
{approach == "gradual": Having received your email, the team arrives curious rather than anxious.}

{knowledge > 2: Your preparation shows. The team can tell you've done your homework.}

A senior developer, Sarah, speaks up: "Two weeks is a lot. What are we cutting?"

* [Propose cutting the least critical features]
    ~ confidence = confidence + 1
    {knowledge > 1:
        "Based on my review, here are three features we can defer without hurting the launch..."
        -> negotiation_good
    - else:
        "I think we should cut... some of the less important things?"
        -> negotiation_weak
    }
* [Ask the team what they think should be cut]
    ~ confidence = confidence + 1
    "You know this codebase better than I do. What can we realistically defer?"
    -> collaborative_planning
* [Insist we can do it all in less time]
    "I believe in this team. Let's find a way to deliver everything."
    -> push_through

=== negotiation_good ===
Sarah nods. "Those are exactly the ones I'd pick. The recommendation engine can wait for v1.1."

~ confidence = confidence + 1

The team starts sketching out a revised timeline. Energy is high.

-> outcome_good

=== negotiation_weak ===
Sarah frowns. "Do you... know what the features actually do?"

There's an awkward silence. You realise you should have prepared more.

~ confidence = confidence - 1

* [Admit you need their help]
    "You're right, I'm still getting up to speed. Help me understand the priorities."
    ~ confidence = confidence + 1
    -> collaborative_planning
* [Double down and pick features at random]
    "Let's cut the... the thing with the graphs."
    -> outcome_poor

=== collaborative_planning ===
The team breaks into a productive discussion. Within an hour, they've identified what to cut, what to simplify, and what to keep.

{confidence > 1: Your willingness to listen has earned their respect.}

~ knowledge = knowledge + 1
~ confidence = confidence + 1

"This is actually better than the original plan," Sarah admits.

-> outcome_good

=== push_through ===
The team exchanges glances. Two weeks of overtime looms.

~ confidence = confidence - 1

A junior developer quietly updates their LinkedIn profile during the meeting.

* [Notice the morale problem and change course]
    "Actually, let me rethink this. What if we prioritised differently?"
    ~ confidence = confidence + 1
    -> collaborative_planning
* [Push forward with overtime]
    -> outcome_poor

=== outcome_good ===
# ENDING: good
Two weeks later, the product launches on time.

{confidence > 2: Your team trusts you. They're already asking about the next project.}
{knowledge > 2: Your thorough approach meant fewer surprises along the way.}
{approach == "contextual": The team felt part of something bigger than just meeting a deadline.}

Your manager stops by again. This time, she's smiling.

"The client is thrilled. And the team says you handled the pressure well."

{confidence > 2 and knowledge > 2:
    The lesson: combining preparation with genuine team collaboration produces the best outcomes. Leading isn't about having all the answers — it's about creating the conditions for the right answers to emerge.
- else:
    {confidence > 2:
        The lesson: confidence and decisiveness matter, but they work best when backed by preparation.
    - else:
        The lesson: thoroughness and humility can compensate for inexperience. The key is knowing when to lead and when to listen.
    }
}

-> END

=== outcome_poor ===
# ENDING: bad
Two weeks later, the product launches — barely.

{confidence < 1: The team doesn't trust your judgment. Two developers have already asked to transfer.}

The launch has bugs. The features that weren't properly descoped are half-finished. The client is disappointed.

Your manager's feedback is gentle but clear: "Next time, lean on your team's expertise. You don't have to have all the answers on day one."

The lesson: pushing through without listening is the fastest path to a poor outcome. New leaders often feel pressure to appear decisive, but the real skill is knowing when to prepare, when to listen, and when to act.

-> END
`.trim()
