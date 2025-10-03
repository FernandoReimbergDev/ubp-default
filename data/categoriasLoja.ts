import { Shirt, CookingPot, Coffee, NotebookPen, Star, Tag } from 'lucide-react';

export const categorias = [
	{
		id: 1,
		text: "Camiseta",
		url: "/categorias/camisetas",
		icone: Shirt,
	},
	{
		id: 2,
		text: "Utilidades",
		url: "/",
		icone: CookingPot,
	},
	{
		id: 3,
		text: "Copos",
		url: "/",
		icone: Coffee,
	},
	{
		id: 4,
		text: "Gráficos",
		url: "/",
		icone: NotebookPen,
	},
	{
		id: 5,
		text: "+Vendidos",
		url: "/",
		icone: Star,
	},
	{
		id: 6,
		text: "Promoção",
		url: "/",
		icone: Tag,
	},
];
