import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Mail, Phone, Building } from "lucide-react";

interface ClientCardProps {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  profile_photo_url?: string;
}

export const ClientCard: React.FC<ClientCardProps> = ({
  id,
  company_name,
  contact_name,
  contact_email,
  contact_phone,
  address,
  profile_photo_url,
}) => {
  const navigate = useNavigate();

  return (
    <Card
      className="p-4 hover:shadow-lg transition-all cursor-pointer border-border"
      onClick={() => navigate(`/clients/${id}`)}
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile_photo_url} />
          <AvatarFallback className="text-lg">
            {company_name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div>
            <h3 className="font-semibold text-lg text-foreground">{company_name}</h3>
            <p className="text-sm text-muted-foreground">{contact_name}</p>
          </div>
          <div className="space-y-1">
            {contact_email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span>{contact_email}</span>
              </div>
            )}
            {contact_phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{contact_phone}</span>
              </div>
            )}
            {address && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 mt-0.5" />
                <span className="line-clamp-1">{address}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function ClientPortal() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Client Portal</h1>
      <p className="text-muted-foreground">Select a client to view details.</p>
    </div>
  );
}
