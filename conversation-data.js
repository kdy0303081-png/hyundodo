'use strict';
// One scene: a friend who waited for a reply yesterday. No API or scoring.
(() => {
 const r=(text,nextState,reply,afterState=nextState)=>({text,nextState,reply,afterState});
 const event=(id,type,text,emotion,reactions,extra={})=>({id,type,text,emotion,reactions,nextStates:Object.fromEntries(Object.entries(reactions).map(([k,v])=>[k,v.nextState])),...extra});
 window.conversationEvents=[
 event('opening','ordinary','오늘 하루 어땠어?','calm',{
 empathy:r('너도 오늘 좀 지쳐 보인다.','calm','응, 오늘은 좀 길었어. 너랑 얘기하니까 좋네.'),
 question:r('너는 오늘 어땠어?','calm','그냥 평소 같았어. 사실, 계속 마음에 걸리는 게 있어.'),
 explain:r('오늘은 할 일이 많아서 정신없었어.','calm','그랬구나. 어제도 많이 바빴던 거야?'),
 wait:r('...','silence','천천히 말해도 돼. 나도 잠깐 숨 좀 돌릴게.','calm')
 }),
 event('topic','topic_change','근데 너 어제 왜 연락 안 했어?','tense',{
 empathy:r('기다리면서 좀 서운했구나.','calm','응. 답장이 없으니까 나만 기다리는 것 같았어.'),
 question:r('많이 기다렸어?','emotional','연락할까 말까 몇 번이나 고민했어.'),
 explain:r('어제는 너무 바빠서 그랬어.','tense','바쁜 건 알아. 그래도 한마디는 할 수 있었잖아.'),
 wait:r('...','silence','화를 내려는 건 아니야. 그냥 신경이 쓰였어.','tense')
 }),
 event('emotion','emotion_change','됐어, 그냥 신경 쓰지 마.','emotional',{
 empathy:r('아직 마음이 많이 상해 있는 것 같아.','calm','사실 어제 발표를 망쳤어. 네가 좀 들어줬으면 했어.'),
 question:r('어제 무슨 일이 있었어?','calm','발표가 생각대로 안 됐어. 혼자 있으니까 더 속상하더라.'),
 explain:r('일부러 답장을 안 한 건 아니었어.','misunderstood','그럼 내가 괜히 예민하게 받아들였다는 거야?','misunderstood'),
 wait:r('...','silence','사실 어제 발표가 잘 안 됐어. 그 얘기를 하고 싶었어.','calm')
 }),
 event('question','sudden_question','내가 힘들다고 하면, 너는 들어줄 수 있어?','tense',{
 empathy:r('혼자 감당하는 기분이었겠네. 지금 듣고 있어.','calm','응. 해결해 주지 않아도 돼. 그냥 들어주면 돼.'),
 question:r('지금은 어떤 얘기부터 하고 싶어?','calm','발표가 끝나고 아무한테도 말을 못 했던 순간부터.'),
 explain:r('나도 요즘 여유가 없어서 그랬어.','misunderstood','내 얘기가 네게 짐이 되는 것처럼 들려.','misunderstood'),
 wait:r('...','silence','바로 대답하기 어려워? 괜찮아, 잠깐 기다릴게.','tense')
 },{variants:['내가 힘들다고 하면, 너는 들어줄 수 있어?','혹시 내 연락이 부담스러웠어?']}),
 event('silence','silence','...','silence',{
 empathy:r('말하기 어려우면 천천히 해도 돼.','calm','고마워. 사실 실패한 것보다 혼자라는 느낌이 더 싫었어.'),
 question:r('지금 어떤 생각 하고 있어?','tense','말을 골라 보고 있었어. 괜히 날카롭게 말할까 봐.','calm'),
 explain:r('내가 연락하지 못한 이유를 말해도 될까?','calm','응. 이번에는 네 얘기도 들어볼게.'),
 wait:r('...','silence','나, 네가 내 편인지 확인하고 싶었던 것 같아.','calm')
 }),
 event('interrupt','interruption','그래서 내가 하고 싶었던 말은…','tense',{
 empathy:r('네 마음을 조금 알 것 같아.','emotional','잠깐, 아직 다 말한 게 아니야. 끝까지 들어줘.','tense'),
 question:r('그때 제일 힘들었던 건 뭐야?','emotional','그 얘기를 하려던 참이었어. 조금만 더 들어줘.','tense'),
 explain:r('나는 그런 뜻이 아니었어.','misunderstood','근데 나는 그렇게 느꼈어.','misunderstood'),
 wait:r('...','silence','…내 얘기를 끝까지 들어줬으면 했다는 거야.','calm')
 }),
 event('misunderstanding','misunderstanding','내 말을 다르게 받아들인 것 같아.','misunderstood',{
 empathy:r('내 말이 네 마음을 밀어내는 것처럼 들렸구나.','calm','응, 그렇게 들렸어. 지금 말해 주니까 조금 알겠어.'),
 question:r('어떤 부분이 그렇게 들렸는지 말해줄래?','calm','네 상황부터 설명하니까 내 감정은 중요하지 않은 것 같았어.'),
 explain:r('그런 의미가 아니었다는 걸 알아줬으면 해.','tense','알겠어. 그런데 내 마음도 조금 알아줬으면 좋겠어.'),
 wait:r('...','silence','나도 네 뜻을 너무 빨리 단정했을 수 있어.','calm')
 }),
 event('closing','closing','이제 네 얘기도 듣고 싶어.','calm',{
 empathy:r('서로 조금씩 더 이야기해 보자.','calm','응. 지금 이렇게 얘기할 수 있어서 다행이야.'),
 question:r('다음에는 어떻게 연락하면 좋을까?','calm','바쁘면 나중에 연락한다고 한마디만 해줘.'),
 explain:r('나도 힘든 날에는 답장이 늦어질 수 있어.','calm','응. 나도 기다리는 동안 혼자 단정하지 않을게.'),
 wait:r('...','silence','오늘은 여기까지 얘기해도 괜찮아. 들어줘서 고마워.','calm')
 },{tenseText:'우리, 지금은 말이 자꾸 엇갈리는 것 같아.'})
 ];
 window.conversationCopy={
 setup:'어제 답장을 놓친 친구와, 하루 끝에 나누는 대화.',
 principle:'대화는 준비하는 것이 아니라, 순간적으로 반응하는 것이다.',
 endings:{calm:'대화의 긴장이 조금 낮아졌습니다.',open:'상대가 조금 더 이야기를 시작했습니다.',misunderstood:'서로의 말이 엇갈렸습니다.',silence:'침묵 이후 상대가 속마음을 이야기했습니다.'}
 };
})();
