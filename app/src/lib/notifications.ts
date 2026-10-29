import { router } from 'expo-router';

import { useStore } from '../store/useStore';
import { colors } from '../theme/tokens';
import { currentUser } from './backend';
import { growthAlert } from './kids';

export type Notice = { init: string; bg: string; text: string; when: string; unread: boolean; open: () => void };

/** What the bell shows: what needs doing (or just happened) on real orders, and children outgrowing their size. */
export function useNotifications(): Notice[] {
  const kids = useStore((s) => s.kids);
  const realOrders = useStore((s) => s.realOrders);
  const people = useStore((s) => s.marketSellers);
  const reviews = useStore((s) => s.orderReviews);
  const me = currentUser()?.id;
  const who = (id: string) => people[id]?.name ?? 'Un parent';

  const orderItems = realOrders.flatMap((o): Notice[] => {
    const open = () => router.push(`/commande/${o.id}`);
    const when = new Date(o.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    if (o.sellerId === me && o.status === 'paid') return [{ init: '€', bg: colors.accent2_300, text: o.delivery === 'main' ? `Vendu ! ${who(o.buyerId)} a acheté « ${o.title} ». Fixez le rendez-vous dans la messagerie.` : `Vendu ! ${who(o.buyerId)} a acheté « ${o.title} ». Expédie-le sous 3 jours.`, when, unread: true, open }];
    if (o.sellerId === me && o.status === 'received') {
      const r = reviews[o.id];
      return [
        ...(r ? [{ init: '⭐', bg: colors.accent100, text: `${who(o.buyerId)} t'a laissé ${r.rating} étoile${r.rating > 1 ? 's' : ''} pour « ${o.title} »${r.comment ? ` : « ${r.comment.slice(0, 80)} »` : ''}`, when, unread: false, open }] : []),
        { init: '💶', bg: colors.accent2_200, text: `${who(o.buyerId)} a bien reçu « ${o.title} » : ton argent est en route vers ton compte bancaire.`, when, unread: false, open },
      ];
    }
    if (o.buyerId === me && o.status === 'received' && !reviews[o.id]) return [{ init: '⭐', bg: colors.accent100, text: `Comment s'est passé ton achat « ${o.title} » ? Laisse un avis à ${who(o.sellerId)}.`, when, unread: true, open }];
    if (o.buyerId === me && o.status === 'shipped') return [{ init: '📦', bg: colors.accent200, text: `« ${o.title} » est en route ! Confirme la réception dès que tu l'as.`, when, unread: true, open }];
    if (o.buyerId === me && o.status === 'cancelled') return [{ init: '↩', bg: colors.neutral300, text: `« ${o.title} » a été vendu juste avant ton paiement : tu as été remboursé·e.`, when, unread: false, open }];
    return [];
  });
  const grow = kids.flatMap((k): Notice[] => {
    const a = growthAlert(k);
    return a ? [{ init: '🌱', bg: colors.accent2_200, text: `Il grandit ! ${a.text}. Prépare sa nouvelle garde-robe.`, when: "Aujourd'hui", unread: true, open: () => router.push(`/passport/${k.id}`) }] : [];
  });
  return [...orderItems, ...grow];
}
