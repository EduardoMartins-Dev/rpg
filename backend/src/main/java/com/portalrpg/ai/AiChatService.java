package com.portalrpg.ai;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.portalrpg.ai.AiDtos.ConversationDetail;
import com.portalrpg.ai.AiDtos.ConversationSummary;
import com.portalrpg.ai.AiDtos.MessageView;
import com.portalrpg.ai.AiDtos.SendMessageResponse;
import com.portalrpg.common.ApiException;
import com.portalrpg.rag.ChatModel;
import com.portalrpg.rag.RagQueryService;
import com.portalrpg.rag.RagQueryService.Grounding;

/**
 * Chat com IA estilo ChatGPT: conversas (contextos) por usuário, com histórico
 * persistido. Cada pergunta recupera trechos do sistema da campanha (RAG) e gera a
 * resposta ancorada, considerando os turnos anteriores da mesma conversa.
 */
@Service
public class AiChatService {

    /** Quantos turnos anteriores enviar ao modelo (limita o tamanho do prompt). */
    private static final int HISTORY_TURNS = 12;
    static final String FALLBACK =
            "Não há material indexado para este sistema; não posso responder com base no livro.";

    private final AiConversationRepository conversations;
    private final AiMessageRepository messages;
    private final RagQueryService rag;
    private final ChatModel chat;

    public AiChatService(AiConversationRepository conversations, AiMessageRepository messages,
            RagQueryService rag, ChatModel chat) {
        this.conversations = conversations;
        this.messages = messages;
        this.rag = rag;
        this.chat = chat;
    }

    @Transactional(readOnly = true)
    public List<ConversationSummary> list(UUID campaignId, UUID userId) {
        return conversations.findByCampaignIdAndUserIdOrderByUpdatedAtDesc(campaignId, userId).stream()
                .map(c -> new ConversationSummary(c.getId(), c.getTitle(), c.getUpdatedAt()))
                .toList();
    }

    @Transactional
    public ConversationSummary create(UUID campaignId, UUID userId) {
        AiConversation c = new AiConversation();
        c.setCampaignId(campaignId);
        c.setUserId(userId);
        c = conversations.save(c);
        return new ConversationSummary(c.getId(), c.getTitle(), c.getUpdatedAt());
    }

    @Transactional(readOnly = true)
    public ConversationDetail get(UUID campaignId, UUID userId, UUID conversationId) {
        AiConversation c = require(campaignId, userId, conversationId);
        List<MessageView> msgs = messages.findByConversationIdOrderByCreatedAtAsc(c.getId()).stream()
                .map(AiChatService::view).toList();
        return new ConversationDetail(c.getId(), c.getTitle(), c.getCreatedAt(), c.getUpdatedAt(), msgs);
    }

    @Transactional
    public void delete(UUID campaignId, UUID userId, UUID conversationId) {
        AiConversation c = require(campaignId, userId, conversationId);
        conversations.delete(c); // cascade remove das mensagens via FK
    }

    @Transactional
    public SendMessageResponse send(UUID campaignId, UUID userId, UUID conversationId, String question) {
        AiConversation c = require(campaignId, userId, conversationId);

        // Histórico anterior (antes de gravar a pergunta atual), limitado aos últimos turnos.
        List<AiMessage> prior = messages.findByConversationIdOrderByCreatedAtAsc(c.getId());
        List<ChatModel.Turn> history = prior.stream()
                .skip(Math.max(0, prior.size() - HISTORY_TURNS))
                .map(m -> new ChatModel.Turn(m.getRole(), m.getContent()))
                .toList();

        persist(c.getId(), AiMessage.ROLE_USER, question, false, 0);

        Grounding g = rag.retrieve(campaignId, question);
        boolean grounded = !g.chunks().isEmpty();
        String answer = grounded
                ? chat.generate(question, g.chunks(), g.systemId(), history)
                : FALLBACK;
        AiMessage assistant = persist(
                c.getId(), AiMessage.ROLE_ASSISTANT, answer, grounded, g.chunks().size());

        // Primeira pergunta nomeia a conversa; toca updated_at para subir na lista.
        if (prior.isEmpty() || "Nova conversa".equals(c.getTitle())) {
            c.setTitle(titleFrom(question));
        }
        conversations.save(c);

        return new SendMessageResponse(c.getId(), c.getTitle(), view(assistant));
    }

    private AiMessage persist(UUID conversationId, String role, String content,
            boolean grounded, int sourceCount) {
        AiMessage m = new AiMessage();
        m.setConversationId(conversationId);
        m.setRole(role);
        m.setContent(content);
        m.setGrounded(grounded);
        m.setSourceCount(sourceCount);
        return messages.save(m);
    }

    private AiConversation require(UUID campaignId, UUID userId, UUID conversationId) {
        return conversations.findByIdAndCampaignIdAndUserId(conversationId, campaignId, userId)
                .orElseThrow(() -> ApiException.notFound("conversation not found"));
    }

    private static String titleFrom(String question) {
        String t = question.strip().replaceAll("\\s+", " ");
        return t.length() <= 60 ? t : t.substring(0, 57).strip() + "…";
    }

    private static MessageView view(AiMessage m) {
        return new MessageView(m.getId(), m.getRole(), m.getContent(),
                m.isGrounded(), m.getSourceCount(), m.getCreatedAt());
    }
}
